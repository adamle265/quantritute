import { handle } from '../../../src/public-api.js';
export const onRequest = ({ request, env, waitUntil }) => handle(request, env, { waitUntil });
