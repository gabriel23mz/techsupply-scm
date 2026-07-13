import crypto from 'crypto';

const TOKEN_TTL_SECONDS =
  60 * 60 * 12;

function getSecret() {
  return (
    process.env.AUTH_SECRET ??
    process.env.JWT_SECRET ??
    'techsupply-mvp-change-this-secret'
  );
}

function encode(value) {
  return Buffer.from(
    JSON.stringify(value),
  ).toString('base64url');
}

function sign(value) {
  return crypto
    .createHmac(
      'sha256',
      getSecret(),
    )
    .update(value)
    .digest('base64url');
}

export function createAuthToken(user) {
  const now = Math.floor(
    Date.now() / 1000,
  );

  const payload = encode({
    sub: user.id,
    rol: user.rol,
    iat: now,
    exp:
      now +
      TOKEN_TTL_SECONDS,
  });

  const signature =
    sign(payload);

  return `${payload}.${signature}`;
}

export function verifyAuthToken(token) {
  if (!token) {
    throw new Error(
      'Token no proporcionado',
    );
  }

  const [
    payload,
    signature,
  ] = token.split('.');

  if (
    !payload ||
    !signature
  ) {
    throw new Error(
      'Token inválido',
    );
  }

  const expected =
    sign(payload);

  const signatureBuffer =
    Buffer.from(signature);

  const expectedBuffer =
    Buffer.from(expected);

  if (
    signatureBuffer.length !==
      expectedBuffer.length ||
    !crypto.timingSafeEqual(
      signatureBuffer,
      expectedBuffer,
    )
  ) {
    throw new Error(
      'Token inválido',
    );
  }

  const data = JSON.parse(
    Buffer.from(
      payload,
      'base64url',
    ).toString('utf8'),
  );

  if (
    Number(data.exp) <
    Math.floor(Date.now() / 1000)
  ) {
    throw new Error(
      'Token expirado',
    );
  }

  return data;
}
