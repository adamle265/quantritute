import { handle } from '../../../src/admin-api.js';
export const onRequest = ({ request, env }) => handle(request, env);
