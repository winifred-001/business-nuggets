import {
  cookies,
} from "next/headers";

import {
  MEMBER_TOKEN_COOKIE_NAME,
} from "@/lib/auth-cookie";

export async function getServerMemberToken() {
  const store =
    await cookies();

  return (
    store.get(
      MEMBER_TOKEN_COOKIE_NAME,
    )?.value ??
    null
  );
}
