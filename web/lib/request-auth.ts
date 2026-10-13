import { currentCliUser, currentUser } from "./auth";

export async function getRequestUser(request: Request) {
const authorization = request.headers.get("authorization");

if (authorization?.startsWith("Bearer ")) {
const token = authorization.slice("Bearer ".length).trim();


if (!token) return null;

return currentCliUser(token);


}

return currentUser();
}
