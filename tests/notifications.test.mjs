import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotificationHandler } from '../supabase/functions/notify-ticket/handler.ts';
const env = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-key', NOTIFICATION_WEBHOOK_SECRET: 'secret', RESEND_API_KEY: 'resend-key', MAIL_FROM: 'Coop <test@example.com>' };
const id = '12345678-1234-1234-1234-123456789abc';
const event = { type:'INSERT', table:'tickets', schema:'public', record:{ id, title:'UNTRUSTED', notification_email:'attacker@example.com' } };
const req = (secret='secret', body=event) => new Request('https://example.com', { method:'POST', headers:{'x-coopfix-secret':secret}, body:JSON.stringify(body) });
const config = { notification_email:'coordination@example.com', notifications_enabled:true, app_url:'https://coop.example.com' };
function mock(options={}) {
  const calls=[];
  const fetcher=async (url, init) => {
    calls.push({url,init});
    if(url.includes('/coop_notification_settings')) return Response.json([options.config ?? config]);
    if(url.includes('/tickets?')) return Response.json(options.missing ? [] : [{id,title:'Fuite',description:'Cuisine',address:{name:'Adresse réelle'},unit:'3'}]);
    if(url.includes('/settings?')) return Response.json([{coop_name:'Ma Coop'}]);
    if(url==='https://api.resend.com/emails') return Response.json({}, {status:options.mailStatus ?? 200});
    throw new Error('unexpected URL');
  };
  return {calls,fetcher};
}
test('rejects an invalid secret before any database or mail request', async()=>{
  const m=mock(); assert.equal((await createNotificationHandler(env,m.fetcher)(req('wrong'))).status,401); assert.equal(m.calls.length,0);
});
test('rejects non-ticket events', async()=>{
  const m=mock(); assert.equal((await createNotificationHandler(env,m.fetcher)(req('secret',{...event,table:'profiles'}))).status,400); assert.equal(m.calls.length,0);
});
test('disabled notifications do not send mail', async()=>{
  const m=mock({config:{...config,notifications_enabled:false}}); assert.equal((await createNotificationHandler(env,m.fetcher)(req())).status,200); assert.equal(m.calls.length,1);
});
test('uses persisted recipient and ticket, with idempotency key', async()=>{
  const m=mock(); assert.equal((await createNotificationHandler(env,m.fetcher)(req())).status,200);
  const mail=m.calls.at(-1); const body=JSON.parse(mail.init.body);
  assert.deepEqual(body.to,['coordination@example.com']); assert.match(body.text,/Fuite/); assert.doesNotMatch(body.text,/UNTRUSTED/); assert.match(body.text,/https:\/\/coop.example.com\/billets\//);
  assert.equal(mail.init.headers['Idempotency-Key'],`coopfix-ticket-${id}`);
});
test('missing ticket sends no email', async()=>{
  const m=mock({missing:true}); assert.equal((await createNotificationHandler(env,m.fetcher)(req())).status,404); assert.equal(m.calls.length,2);
});
test('mail provider failure is reported', async()=>{
  const m=mock({mailStatus:500}); assert.equal((await createNotificationHandler(env,m.fetcher)(req())).status,502);
});
test('missing mail service configuration is reported', async()=>{
  const m=mock(); assert.equal((await createNotificationHandler({...env,RESEND_API_KEY:''},m.fetcher)(req())).status,503); assert.equal(m.calls.length,1);
});
const completedAt='2026-09-25T03:00:00+00:00';
const completion={type:'UPDATE',table:'tickets',schema:'public',record:{id,status:'termine',completed_at:completedAt},old_record:{status:'en_cours'}};
const info={type:'INSERT',table:'ticket_comments',schema:'public',record:{id,is_info_request:true}};
function memberMock(options={}) {
 const m=mock(options); const fetcher=async(url,init)=>{
  if(url.includes('/ticket_comments?')) {m.calls.push({url,init});return Response.json([{ticket_id:id,body:'Quelle pièce ?',is_info_request:true}]);}
  if(url.includes('/tickets?')) {m.calls.push({url,init});return Response.json([{id,title:'Fuite',created_by:'member-id',status:'termine',completed_at:completedAt}]);}
  if(url.includes('/auth/v1/admin/users/')) {m.calls.push({url,init});return Response.json({email:'member@example.com'});}
  return m.fetcher(url,init);
 };
 return {...m,fetcher};
}
test('completion alerts only the member, including when coordination alerts are off',async()=>{
 const m=memberMock({config:{...config,notifications_enabled:false}});
 assert.equal((await createNotificationHandler(env,m.fetcher)(req('secret',completion))).status,200);
 const mail=m.calls.at(-1); const body=JSON.parse(mail.init.body);
 assert.deepEqual(body.to,['member@example.com']); assert.match(body.subject,/complété/);
 assert.equal(mail.init.headers['Idempotency-Key'],`coopfix-completed-${id}-${completedAt}`);
});
test('info requests alert member with actual saved question',async()=>{
 const m=memberMock(); assert.equal((await createNotificationHandler(env,m.fetcher)(req('secret',info))).status,200);
 const body=JSON.parse(m.calls.at(-1).init.body); assert.deepEqual(body.to,['member@example.com']); assert.match(body.text,/Quelle pièce/);
});
test('ordinary comments send no alert',async()=>{
 const m=memberMock(); assert.equal((await createNotificationHandler(env,m.fetcher)(req('secret',{...info,record:{id,is_info_request:false}}))).status,200); assert.equal(m.calls.length,0);
});
test('editing a completed ticket does not re-alert the member',async()=>{
 const m=memberMock(); assert.equal((await createNotificationHandler(env,m.fetcher)(req('secret',{...completion,old_record:{status:'termine'}}))).status,200); assert.equal(m.calls.length,0);
});
test('unrelated status changes do not notify completion',async()=>{
 const m=memberMock(); assert.equal((await createNotificationHandler(env,m.fetcher)(req('secret',{...completion,record:{id,status:'en_cours'}}))).status,200); assert.equal(m.calls.length,0);
});
