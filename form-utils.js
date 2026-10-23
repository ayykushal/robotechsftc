/* Browser-only validation. Delivery and abuse controls belong on a future server. */
(function(scope){
 function validateContact(input){
  const name=String(input.name||'').trim();
  const email=String(input.email||'').trim();
  const message=String(input.message||'').trim();
  if(String(input.website||'').trim())return {ok:false,bot:true,error:'Unable to prepare this message. Please email the team directly.'};
  if(name.length<2||name.length>150||/[\r\n\x00-\x1f\x7f]/.test(name))return {ok:false,field:'name',error:'Enter a name between 2 and 150 characters, on one line.'};
  if(email.length>254||!(/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/).test(email)||/[\x00-\x1f\x7f]/.test(email))return {ok:false,field:'email',error:'Enter a valid email address.'};
  if(message.length<10||message.length>1500||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(message))return {ok:false,field:'message',error:'Write a message between 10 and 1,500 characters.'};
  return {ok:true,name,email,message};
 }
 scope.RobotechsForm={validateContact};
 if(typeof module!=='undefined')module.exports={validateContact};
})(typeof window!=='undefined'?window:globalThis);
