// /en/chapters.json: o mesmo de /chapters.json, com nomes e frases em inglês.
import { nextMap } from '../chapters.json.js';
export async function GET() { return new Response(JSON.stringify(await nextMap('en')), { headers: { 'Content-Type': 'application/json' } }); }
