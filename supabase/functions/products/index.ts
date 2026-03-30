import { createClient } from "npm:@supabase/supabase-js@2";

type ProductPayload = {
  productCode?: string;
  productName?: string;
  description?: string | null;
  unitPrice?: number;
  inventoryCount?: number;
  isActive?: boolean;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const productColumns = `
  id,
  product_code,
  product_name,
  description,
  unit_price,
  inventory_count,
  is_active,
  created_at,
  updated_at
`;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}

function errorResponse(status: number, message: string, details?: string) {
  return jsonResponse(
    {
      error: {
        message,
        details,
      },
    },
    status,
  );
}

function escapeLikeValue(value: string) {
  return value.replace(/[%_,]/g, "\\$&");
}

function parsePayload(body: ProductPayload, isPatch = false) {
  const normalizedCode = body.productCode?.trim();
  const normalizedName = body.productName?.trim();
  const normalizedDescription =
    typeof body.description === "string" ? body.description.trim() : body.description;

  if (!isPatch || body.productCode !== undefined) {
    if (!normalizedCode) {
      return { error: "Mã sản phẩm là bắt buộc." };
    }
  }

  if (!isPatch || body.productName !== undefined) {
    if (!normalizedName) {
      return { error: "Tên sản phẩm là bắt buộc." };
    }
  }

  if (body.unitPrice !== undefined) {
    if (!Number.isFinite(body.unitPrice) || body.unitPrice < 0) {
      return { error: "Giá sản phẩm phải là số không âm." };
    }
  }

  if (body.inventoryCount !== undefined) {
    if (
      !Number.isInteger(body.inventoryCount) ||
      body.inventoryCount < 0
    ) {
      return { error: "Tồn kho phải là số nguyên không âm." };
    }
  }

  return {
    value: {
      product_code: normalizedCode,
      product_name: normalizedName,
      description: normalizedDescription || null,
      unit_price: body.unitPrice,
      inventory_count: body.inventoryCount,
      is_active: body.isActive,
    },
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return errorResponse(401, "Thiếu thông tin xác thực.");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl || !supabaseKey) {
    return errorResponse(500, "Thiếu cấu hình Supabase cho Edge Function.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return errorResponse(401, "Phiên đăng nhập không hợp lệ.");
    }

    const userId = userData.user.id;
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const query = url.searchParams.get("q")?.trim() ?? "";
    const code = url.searchParams.get("code")?.trim() ?? "";

    if (request.method === "GET") {
      let builder = supabase
        .from("products")
        .select(productColumns)
        .order("updated_at", { ascending: false });

      if (id) {
        builder = builder.eq("id", id);
      } else if (code) {
        builder = builder.eq("product_code", code);
      } else if (query) {
        const keyword = escapeLikeValue(query);
        builder = builder.or(
          `product_code.ilike.%${keyword}%,product_name.ilike.%${keyword}%`,
        );
      }

      const { data, error } = await builder;
      if (error) {
        return errorResponse(400, "Không thể lấy danh sách sản phẩm.", error.message);
      }

      return jsonResponse({
        data,
        meta: {
          total: data.length,
          query,
        },
      });
    }

    if (request.method === "POST") {
      const payload = await request.json() as ProductPayload;
      const parsed = parsePayload(payload);

      if ("error" in parsed) {
        return errorResponse(400, parsed.error);
      }

      const { data, error } = await supabase
        .from("products")
        .insert({
          ...parsed.value,
          user_id: userId,
        })
        .select(productColumns)
        .single();

      if (error) {
        const status = error.code === "23505" ? 409 : 400;
        return errorResponse(status, "Không thể tạo sản phẩm.", error.message);
      }

      return jsonResponse({ data }, 201);
    }

    if (request.method === "PATCH") {
      if (!id) {
        return errorResponse(400, "Thiếu id sản phẩm cần cập nhật.");
      }

      const payload = await request.json() as ProductPayload;
      const parsed = parsePayload(payload, true);

      if ("error" in parsed) {
        return errorResponse(400, parsed.error);
      }

      const updates = Object.fromEntries(
        Object.entries(parsed.value).filter(([, value]) => value !== undefined),
      );

      if (Object.keys(updates).length === 0) {
        return errorResponse(400, "Không có dữ liệu hợp lệ để cập nhật.");
      }

      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select(productColumns)
        .single();

      if (error) {
        const status = error.code === "PGRST116" ? 404 : 400;
        return errorResponse(status, "Không thể cập nhật sản phẩm.", error.message);
      }

      return jsonResponse({ data });
    }

    if (request.method === "DELETE") {
      if (!id) {
        return errorResponse(400, "Thiếu id sản phẩm cần xóa.");
      }

      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) {
        return errorResponse(400, "Không thể xóa sản phẩm.", error.message);
      }

      return jsonResponse({ success: true });
    }

    return errorResponse(405, "Phương thức không được hỗ trợ.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";

    return errorResponse(500, "Edge Function xử lý thất bại.", message);
  }
});
