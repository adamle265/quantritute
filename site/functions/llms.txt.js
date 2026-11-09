// v1.33 GEO (04/11/2026): /llms.txt tự sinh – xem src/seo.js → llmsTxt
import { llmsTxt } from '../../src/seo.js';
export const onRequestGet = (ctx) => llmsTxt(ctx);
