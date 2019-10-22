var moment = Moment.load();
function sendWithTimer(){
  var sh = new sheet("リスト");
  var content_type = sh.getvalue(2,10);
  var content = sh.getvalue(2,11);
  var ln = new line();
  
  ln.send_line("U9be55013173baa8e74bd116afa7ec6b5",content_type+"#"+content+"を送信します");
  if(content_type == "all"){
    var sendMessage = "@KBF\n"+content;
    for(i=1;i<sh.get_last_row();i++){
      if("〇" == sh.getvalue(sh.find_row(id_col, i+1), entry_col)){
        userId = sh.getvalue(sh.find_row(id_col, i+1), userId_col);
        ln.send_line(userId,sendMessage);
      }
    }
  }else if(content_type == "template"){
    for(i=1;i<sh.get_last_row();i++){
      if("〇" == sh.getvalue(sh.find_row(id_col, i+1), entry_col)){
        userId = sh.getvalue(sh.find_row(id_col, i+1), userId_col);
        ln.send_template(userId,content);
      }
    }
  }else if(content_type == "confirm"){
    for(i=1;i<sh.get_last_row();i++){
      if("〇" == sh.getvalue(sh.find_row(id_col, i+1), entry_col)){
        userId = sh.getvalue(sh.find_row(id_col, i+1), userId_col);
        ln.send_confirm(userId,content);
      }
    }
  }
  ln.send_line("U9be55013173baa8e74bd116afa7ec6b5","finish");
}
function setTrigger(content,date) {
  var ln = new line();
  var sh = new sheet("リスト");
  sh.setvalue(2,10,content[0]);
  sh.setvalue(2,11,content[1]);
  var triggerDay = moment(date,'YYYY年MM月DD日H時m分').toDate(); 
  if(triggerDay < moment().toDate()){
     ln.send_line("U9be55013173baa8e74bd116afa7ec6b5","日時を過ぎてます");
  }else{
    deleteTriggers();
    var trigger =  ScriptApp.newTrigger("sendWithTimer").timeBased().at(triggerDay).create();
    ln.send_line("U9be55013173baa8e74bd116afa7ec6b5",date+"に"+content[0]+"#"+content[1]+"をセットしました");
  }
}
function deleteTriggers(){
  var triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}
function seeTriggers(){
  var triggers = ScriptApp.getProjectTriggers();
  var ln = new line();
  ln.send_line("U9be55013173baa8e74bd116afa7ec6b5",triggers.length +"Trigger");
}