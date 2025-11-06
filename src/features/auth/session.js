// almacenamiento sin dependencias (web=localStorage, móvil=memoria)
const mem = new Map();
const safeLocal = {
  get(k){ try{ return typeof window!=="undefined"&&window.localStorage.getItem(k) }catch{ return null } },
  set(k,v){ try{ if(typeof window!=="undefined") window.localStorage.setItem(k,v) }catch{} },
  del(k){ try{ if(typeof window!=="undefined") window.localStorage.removeItem(k) }catch{} },
};
const getItem = async (k)=> safeLocal.get(k) ?? mem.get(k) ?? null;
const setItem = async (k,v)=> (typeof window!=="undefined" ? safeLocal.set(k,v) : mem.set(k,v));
const delItem = async (k)=> (typeof window!=="undefined" ? safeLocal.del(k) : mem.delete(k));

const KEY_USERS   = "@users";
const KEY_SESSION = "@session";

export async function loadUsers(){
  const raw = await getItem(KEY_USERS); 
  try{ return JSON.parse(raw||"[]") }catch{ return [] }
}
export async function saveUsers(arr){ await setItem(KEY_USERS, JSON.stringify(arr||[])); }

export async function getSession(){
  const raw = await getItem(KEY_SESSION);
  try{ return JSON.parse(raw||"null") }catch{ return null }
}
export async function setSession(obj){ await setItem(KEY_SESSION, JSON.stringify(obj)); }
export async function clearSession(){ await delItem(KEY_SESSION); }

export function hash(s){ try{ return btoa(unescape(encodeURIComponent(s))) }catch{ return s } }

// validación fuerte de contraseña
export function validateStrongPassword(pw){
  if(!pw || pw.length<12 || pw.length>16) return {ok:false,msg:"12–16 caracteres"};
  if(!/[a-z]/.test(pw)) return {ok:false,msg:"Falta minúscula"};
  if(!/[A-Z]/.test(pw)) return {ok:false,msg:"Falta mayúscula"};
  if(!/[0-9]/.test(pw)) return {ok:false,msg:"Falta número"};
  if(!/[^A-Za-z0-9]/.test(pw)) return {ok:false,msg:"Falta símbolo"};
  return {ok:true,msg:"OK"};
}
