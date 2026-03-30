process.loadEnvFile?.(".env");

import { createClient } from "@supabase/supabase-js";

const mailboxBaseUrl = "https://api.mail.tm";
const pollDelayInMs = 3000;
const maxPollAttempts = 20;

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return {
    publishableKey,
    supabaseUrl,
  };
}

async function requestMailbox(path, options) {
  const response = await fetch(`${mailboxBaseUrl}${path}`, options);

  if (!response.ok) {
    throw new Error(`mail.tm request failed: ${response.status}`);
  }

  return response.json();
}

async function createMailboxAccount() {
  const domainsPayload = await requestMailbox("/domains?page=1", {
    method: "GET",
  });
  const domain = domainsPayload["hydra:member"]?.[0]?.domain;

  if (!domain) {
    throw new Error("Không lấy được domain tạm cho email test.");
  }

  const mailbox = `codex-${Date.now()}@${domain}`;
  const password = `Codex#${Date.now()}`;

  await requestMailbox("/accounts", {
    body: JSON.stringify({
      address: mailbox,
      password,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const tokenPayload = await requestMailbox("/token", {
    body: JSON.stringify({
      address: mailbox,
      password,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return {
    mailbox,
    mailboxToken: tokenPayload.token,
    password,
  };
}

function extractConfirmationLink(message) {
  const html = Array.isArray(message.html) ? message.html.join("\n") : "";
  const text = `${html}\n${message.text ?? ""}`;
  const match = text.match(
    /https:\/\/[^"'\s>]+auth\/v1\/verify[^"'\s<]+/i,
  );

  return match?.[0] ?? null;
}

async function waitForConfirmationLink(mailboxToken) {
  for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
    const messagesPayload = await requestMailbox("/messages?page=1", {
      headers: {
        Authorization: `Bearer ${mailboxToken}`,
      },
      method: "GET",
    });
    const messageId = messagesPayload["hydra:member"]?.[0]?.id;

    if (messageId) {
      const message = await requestMailbox(`/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${mailboxToken}`,
        },
        method: "GET",
      });
      const link = extractConfirmationLink(message);

      if (link) {
        return link.replace(/&amp;/g, "&");
      }
    }

    await new Promise((resolve) => {
      setTimeout(resolve, pollDelayInMs);
    });
  }

  throw new Error("Không nhận được email xác nhận từ Supabase trong thời gian chờ.");
}

export async function createConfirmedTestAccount() {
  const { supabaseUrl, publishableKey } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const seededEmail = process.env.E2E_TEST_EMAIL;
  const seededPassword = process.env.E2E_TEST_PASSWORD;

  if (seededEmail && seededPassword) {
    const signInResult = await supabase.auth.signInWithPassword({
      email: seededEmail,
      password: seededPassword,
    });

    if (signInResult.error || !signInResult.data.session) {
      throw new Error(
        `Không đăng nhập được user test cố định: ${signInResult.error?.message ?? "unknown"}`,
      );
    }

    return {
      email: seededEmail,
      password: seededPassword,
      session: signInResult.data.session,
      supabase,
    };
  }

  const { mailbox, mailboxToken, password } = await createMailboxAccount();

  const signUpResult = await supabase.auth.signUp({
    email: mailbox,
    password,
  });

  if (signUpResult.error) {
    throw new Error(`Không tạo được user test: ${signUpResult.error.message}`);
  }

  const confirmationLink = await waitForConfirmationLink(mailboxToken);
  const confirmationResponse = await fetch(confirmationLink, {
    redirect: "follow",
  });

  if (!confirmationResponse.ok) {
    throw new Error(`Xác nhận tài khoản thất bại: ${confirmationResponse.status}`);
  }

  const signInResult = await supabase.auth.signInWithPassword({
    email: mailbox,
    password,
  });

  if (signInResult.error || !signInResult.data.session) {
    throw new Error(
      `Không đăng nhập được user test sau xác nhận: ${signInResult.error?.message ?? "unknown"}`,
    );
  }

  return {
    email: mailbox,
    password,
    session: signInResult.data.session,
    supabase,
  };
}
