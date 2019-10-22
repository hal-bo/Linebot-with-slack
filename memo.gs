var channel_access_token = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
var slack_access_token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
var verify_token = "Fyipv2gtjaUG1bNxtxlKM3Ho";
var id_col = 2;
var userId_col = 3;
var displayName_col = 4;
var name_col = 5
var entry_col = 6;
var admin_col = 7;

var tableentry_row = 5;

var ad_id_col = 1;
var ad_userId_col = 2;
var ad_name_col = 3;
var top_ad_col = 4;
function doPost(e) {
  if (e.parameter.text != undefined) {
    var sl = new get_slack(e);
    sl.main();

  } else {
    var ln = new line(e);
    ln.main();
  }
}

/**
* Sheet Class.
*/
var sheet = function (list_name) {
  //this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  //this.sheet = this.spreadsheet.getSheets()[0];
  var id = '1wzQS69wX3pH8LGaRPMQe5i-qbK3190vean0T22OVFcQ'
  this.sheet = SpreadsheetApp.openById(id).getSheetByName(list_name);

  /**
  * Set value.
  */
  this.setvalue = function (row, column, value) {
    this.sheet.getRange(row, column).setValue(value);
  };

  /**
  * Get value.
  */
  this.getvalue = function (row, column) {
    var value = this.sheet.getRange(row, column).getValue();
    return value;
  };

  /**
  * Delete row.
  */
  this.delete_row = function (row) {
    // for return 0
    try {
      this.sheet.deleteRow(row);
    } catch (e) {
      Logger.log(e);
    }
  };

  /**
  * Get last row.
  */
  this.get_last_row = function () {
    return this.sheet.getLastRow();
  };
  
  this.get_last_col = function () {
    return this.sheet.getLastColumn();
  };

  /**
  * Find row of same text
  */
  this.find_row = function (column, value) {
    for (var row = 1; row <= this.get_last_row(); row++) {
      if (this.getvalue(row, column) == value) return row;
    }
    return 0;
  };
  
  this.find_col = function (row, value) {
    for (var col = 1; col <= this.get_last_col(); col++) {
      if (this.getvalue(row, col) == value) return col;
    }
    return 0;
  };

};

/**
* Webhook slack class.
*/
var get_slack = function (e) {
  this.slack = e.parameter;
  this.ln = new line();
  this.sh = new sheet("リスト");

  /**
  * Main function.
  */
  this.main = function () {
    
    var text = this.get_text(this.slack);
    var userId;
    
    if (text[1] != undefined) {
      if("all" == text[0]){
        text = text[1];
        for(i=0;i<this.sh.get_last_row();i++){
          if("〇" == this.sh.getvalue(this.sh.find_row(id_col, i+1), entry_col)){
            userId = this.sh.getvalue(this.sh.find_row(id_col, i+1), userId_col);
            this.ln.send_line(userId,text);
          }
        }
        
      }else if("template" == text[0]){
        if(text[7] != undefined){
          for(i=0;i<this.sh.get_last_row();i++){
            if("〇" == this.sh.getvalue(this.sh.find_row(id_col, i+1), entry_col)){
              userId = this.sh.getvalue(this.sh.find_row(id_col, i+1), userId_col);
              this.ln.send_template(userId,text);
            }
          }
        }else{
          userId = this.sh.getvalue(this.sh.find_row(id_col, 1), userId_col);
          this.ln.send_line(userId,"template構文を間違えています");
        }
      }else if("confirm" == text[0]){
        if(text[6] != undefined){
          for(i=0;i<this.sh.get_last_row();i++){
            if("〇" == this.sh.getvalue(this.sh.find_row(id_col, i+1), entry_col)){
              userId = this.sh.getvalue(this.sh.find_row(id_col, i+1), userId_col);
              this.ln.send_confirm(userId,text);
            }
          }
        }else{
          userId = this.sh.getvalue(this.sh.find_row(id_col, 1), userId_col);
          this.ln.send_line(userId,"confirm構文を間違えています");
        }
      }else{
        userId = this.sh.getvalue(this.sh.find_row(id_col, text[0]), userId_col);
        PropertiesService.getScriptProperties().setProperty('userId', userId);
        text = text[1];
        this.ln.send_line(userId,text);
      }
    } else {
      text = text[0];
      userId = this.sh.getvalue(this.sh.find_row(id_col, 1), userId_col);
      this.ln.send_line(userId,"**"+text);
    }
  };

  /**
  * Get text.
  * return array.
  */
  this.get_text = function (slack) {
    var text;
    if (slack.trigger_word != undefined) text = slack.text.replace(slack.trigger_word, '');
    else text = slack.text;
    //text = text.split(/@([\s\S]*?):/);
    text = text.split("#");
    // if (text[0] == '') text = text[2];
    // else text = text[0];
    return text;
  };

};

/**
* Line Class.
*/
var line = function (e) {
  this.token = channel_access_token;
  if (e != undefined) this.line = JSON.parse(e.postData.contents).events[0];
  this.headers = {
    'Authorization': 'Bearer ' + this.token
  };
  this.options = {
    'headers': this.headers
  };
  this.sk = new slack();
  this.sh = new sheet("リスト");
  this.admin_sh = new sheet("管理者");
  
  
  this.last_row = this.sh.get_last_row();

  /**
  * Main function.
  */
  this.main = function () {
    var profile;
    switch (this.line.type) {
      case 'follow':
        profile = this.get_line_profile(this.line);
        this.sk.postSlackMessage('```follow```', profile);
        this.send_line(this.line.source.userId,"名前を教えてください");
        // set sheet
        this.sh.setvalue(this.last_row + 1, id_col, this.last_row);
        this.sh.setvalue(this.last_row + 1, userId_col, this.line.source.userId);
        this.sh.setvalue(this.last_row + 1, displayName_col, profile.displayName);
        this.sh.setvalue(this.last_row + 1, admin_col, 1);
        this.sh.setvalue(this.last_row + 1, entry_col, "〇");
        break;
      case 'unfollow':
        profile = this.get_line_profile(this.line);
        this.sk.postSlackMessage('```unfollow```', profile);
        // Deletes the row of the user ID.
        this.sh.delete_row(this.sh.find_row(userId_col, this.line.source.userId));
        break;
      case 'join':
        this.sk.postSlackMessage('Join group: ' + this.line.source.groupId);
        break;
      case 'leave':
        this.sk.postSlackMessage('Leave group: ' + this.line.source.groupId);
        break;
      case 'message':
        profile = this.get_line_profile(this.line);
        switch (this.line.source.type) {
          case 'user':
            this.sk.postSlackMessage(this.get_line_message(this.line), profile);
            
            //新入生
            if(this.sh.find_row(userId_col,this.line.source.userId) != 0){
              var replyMessage = this.sh.getvalue(this.sh.find_row(userId_col,this.line.source.userId),id_col)+"@"+this.sh.getvalue(this.sh.find_row(userId_col,this.line.source.userId),name_col)+"\n"+this.get_line_message(this.line);
              var admin_id = this.sh.getvalue(this.sh.find_row(userId_col,this.line.source.userId),admin_col);
              this.send_line(this.admin_sh.getvalue(this.admin_sh.find_row(ad_id_col,admin_id),ad_userId_col),replyMessage);
              
              if(this.sh.getvalue(this.sh.find_row(userId_col,this.line.source.userId),name_col) != ""){
                if(this.get_line_message(this.line) == "氏名変更"){
                  this.sh.setvalue(this.sh.find_row(userId_col,this.line.source.userId),name_col,"");
                  this.send_line(this.line.source.userId,"名前を教えてください");
                }
              }else{
                //this.send_line(this.line.source.userId,"「"+this.line.message.text+"」さんでよろしいですか？");
                //this.send_template(this.line.source.userId,["template","title","select","3","up","6","2","3","4"]);
                //this.send_confirm(this.line.source.userId,["confirm",name_col,"「"+this.line.message.text+"」さんでよろしいですか？","はい",this.line.message.text,"いいえ","","name"]);
                this.send_confirm(this.line.source.userId,["name",this.line.message.text]);
              }
              
            //管理者
            }else{
              var ad_row = this.admin_sh.find_row(ad_userId_col,this.line.source.userId);
              var admin_id = this.admin_sh.getvalue(ad_row,ad_id_col);
              text = this.get_line_message(this.line);
              text = text.split("#");
              if(text[1] != undefined){
                var to_id = text[0];
                
                //上級管理者
                if("〇" == this.admin_sh.getvalue(ad_row,top_ad_col)){
                  if(to_id == "all"){
                    var sendMessage = "@KBF\n"+text[1];
                    this.send_line(this.line.source.userId,"all");
                    for(i=1;i<this.sh.get_last_row();i++){
                      if("〇" == this.sh.getvalue(this.sh.find_row(id_col, i+1), entry_col)){
                        userId = this.sh.getvalue(this.sh.find_row(id_col, i+1), userId_col);
                        this.send_line(userId,sendMessage);
                      }
                    }
                  }else if(to_id == "template"){
                    var maxid = this.sh.getvalue(tableentry_row - 1, id_col);
                    this.send_line(this.line.source.userId,"templateを送信します");
                    for(i=1;i<maxid+1;i++){
                      var user_row = this.sh.find_row(id_col,i);
                      if(user_row == 0){
                        continue;
                      }
                      if("〇" == this.sh.getvalue(user_row, entry_col)){
                        userId = this.sh.getvalue(user_row, userId_col);
                        //this.send_template(userId,["template","title","select","3","up","6","2","3","4"]);
                        this.send_template(userId,text[1]);
                      }
                      if(i == maxid){
                          this.send_line(this.line.source.userId,"templateを送信しました");
                       }
                    }
                  }else if(to_id == "confirm"){
                    
                    var maxid = this.sh.getvalue(tableentry_row - 1, id_col);
                    this.send_line(this.line.source.userId,"confirmを送信します");
                    for(i=1;i<maxid+1;i++){
                      var user_row = this.sh.find_row(id_col,i);
                      if(user_row == 0){
                        continue;
                      }
                      if("〇" == this.sh.getvalue(user_row, entry_col)){
                        userId = this.sh.getvalue(user_row, userId_col);
                        //this.send_confirm(userId,["confirm",name_col,"コンファーム","はい",this.line.message.text,"いいえ","","name"]);
                        this.send_confirm(userId,text[1]);
                      }
                      if(i == maxid){
                          this.send_line(this.line.source.userId,"confirmを送信しました");
                      }
                    }
                    
                  }else if(to_id == "trigger"){
                    if(text[2] != undefined){
                      var sendtime = 0;
                      if(text[1] == "template"){
                        var template_sheet = new sheet("template");
                        var tem_num_row = template_sheet.find_row(1,text[2]);
                        sendtime    = template_sheet.getvalue(tem_num_row,2);
                      }else if (text[1] == "confirm"){
                        var confirm_sheet = new sheet("confirm");
                        var com_num_row = confirm_sheet.find_row(1,text[2]);
                        sendtime    = confirm_sheet.getvalue(com_num_row,2);
                      }else if(text[1] == "all"){
                        sendtime = text[2];
                      }
                      if(sendtime != 0){
                        setTrigger([text[1],text[2]],sendtime);
                      }else{
                        this.send_line(this.line.source.userId,"日時が設定されていません");
                      }
                    }else if(text[1] == "see"){
                      this.send_line(this.line.source.userId,"seeTrigger");
                      seeTriggers();
                    }else if(text[1] == "delete"){
                      this.send_line(this.line.source.userId,"deleteTrigger");
                      deleteTriggers();
                    }else{
                      this.send_line(this.line.source.userId,"構文ミスです\n***************\ntrigger#送信方式#送信内容\n***************\nの構文で送ってください");
                    }
                  }else{
                    var sendMessage = "@"+this.admin_sh.getvalue(ad_row,ad_name_col)+"\n"+text[1];
                    if(admin_id == this.sh.getvalue(this.sh.find_row(id_col,to_id),admin_col)){
                      this.send_line(this.sh.getvalue(this.sh.find_row(id_col,to_id),userId_col),sendMessage);
                    }else{
                      this.send_line(this.line.source.userId,"この送信先への送信権限がありません"); 
                    }
                  }
                  
                  
                }else{
                  var sendMessage = "@"+this.admin_sh.getvalue(ad_row,ad_name_col)+"\n"+text[1];
                  if(admin_id == this.sh.getvalue(this.sh.find_row(id_col,to_id),admin_col)){
                    this.send_line(this.sh.getvalue(this.sh.find_row(id_col,to_id),userId_col),sendMessage);
                  }else{
                    this.send_line(this.line.source.userId,"この送信先への送信権限がありません"); 
                  }
                }
              }else{
                this.send_line(this.line.source.userId,"構文ミスです\n***************\n送信先id#送信内容\n***************\nの構文で送ってください");
              }
            }
              
            break;
          case 'group':
            break;
          case 'room':
            break;
        }
        break;
      case 'postback' :
        profile = this.get_line_profile(this.line);
        switch (this.line.source.type) {
          case 'user':
            var data = this.line.postback.data.split('#');
            this.sk.postSlackMessage(this.line.postback.data+"を選択しました", profile);
            this.sh.setvalue(this.sh.find_row(userId_col, this.line.source.userId), data[0], data[1]);
            if(data[2] == "氏名確認" && data[1] != ""){
              this.send_line(this.line.source.userId,data[1]+"さんだね。ありがとう！違ったら「氏名変更」と送ってね");
            }else if(data[2] == "氏名確認" && data[1] == ""){
              this.send_line(this.line.source.userId,"本名を教えてください");
            }
            break;
          case 'group':
            break;
          case 'room':
            break;
        }
        break;
      default:
        this.sk.postSlackMessage(this.line);
        break;
    }
  };

  /**
  * Get line Message.
  */
  this.get_line_message = function (line) {
    switch (line.message.type) {
      case 'text':
        return line.message.text;
      case 'image':
        return this.get_url_of_drive_files(line.message.id);
      case 'video':
        return this.get_url_of_drive_files(line.message.id);
      case 'audio':
        return this.get_url_of_drive_files(line.message.id);
      case 'file':
        return this.get_url_of_drive_files(line.message.id);
      case 'location':
        return 'location';
      case 'sticker':
        return 'https://stickershop.line-scdn.net/stickershop/v1/sticker/' + line.message.stickerId + '/android/sticker.png';
      default:
        return 0;
    }
  };

  /**
  * Get url of Drive files.
  */
  this.get_url_of_drive_files = function (message_id) {
    var url = 'https://api.line.me/v2/bot/message/' + message_id + '/content';
    var blob = UrlFetchApp.fetch(url, this.options);
    var file = DriveApp.createFile(blob);
    return file.getUrl();
  };


  /**
  * Get line profile.
  */
  this.get_line_profile = function (line) {
    var url, response, profile;
    switch (line.source.type) {
      case 'user':
        url = 'https://api.line.me/v2/bot/profile/' + line.source.userId;
        break;
      case 'group':
        url = 'https://api.line.me/v2/bot/group/' + line.source.groupId + '/member/' + line.source.userId;
        break;
      case 'room':
        url = 'https://api.line.me/v2/bot/room/' + line.source.groupId + '/member/' + line.source.userId;
        break;
    }
    try {
      response = UrlFetchApp.fetch(url, this.options);
      profile = JSON.parse(response.getContentText());
    } catch (e) {
      this.sk.postSlackMessage(e);
    }
    return profile;
  };

  /**
  * Send message to LINE.
  */
  this.send_line = function (id, text) {
    var url = "https://api.line.me/v2/bot/message/push";
    var headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + this.token,
    };
    var postData = {
      "to": id,
      "messages": [{
        'type': 'text',
        'text': text
      }]
    };
    var options = {
      "method": "post",
      "headers": headers,
      "payload": JSON.stringify(postData)
    };
    UrlFetchApp.fetch(url, options);
  };
  this.send_template = function (id, template_num){
    var template_sheet = new sheet("template");
    var url = "https://api.line.me/v2/bot/message/push";
    var headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + this.token,
    };
    var actions;
    
    var tem_num_row      = template_sheet.find_row(1,template_num);
    var tem_time         = template_sheet.getvalue(tem_num_row,2);
    var tem_eventname    = template_sheet.getvalue(tem_num_row,3);
    var tem_title        = template_sheet.getvalue(tem_num_row,4);
    var tem_description  = template_sheet.getvalue(tem_num_row,5);
    var tem_image        = template_sheet.getvalue(tem_num_row,6);
    var tem_selectionnum = template_sheet.getvalue(tem_num_row,7);
    var tem_one          = template_sheet.getvalue(tem_num_row,8);
    var tem_onedata      = template_sheet.getvalue(tem_num_row,9);
    var tem_two          = template_sheet.getvalue(tem_num_row,10);
    var tem_twodata      = template_sheet.getvalue(tem_num_row,11);
    var tem_three        = template_sheet.getvalue(tem_num_row,12);
    var tem_threedata    = template_sheet.getvalue(tem_num_row,13);
    
    var data_col = this.sh.find_col(tableentry_row,tem_eventname);
    if(tem_selectionnum == 2){
      actions = 
        [{
          "type": "postback",
          "label": tem_one,
          "data": data_col+"#"+tem_onedata,
          "displayText": "「"+ tem_one + "」" + "を選択しました"
        },
         {
           "type": "postback",
           "label": tem_two,
           "data": data_col+"#"+tem_twodata,
           "displayText": "「"+ tem_two + "」" + "を選択しました"
         }
        ];
    }else if(tem_selectionnum == 3){
      actions = [{
        "type": "postback",
        "label": tem_one,
        "data": data_col+"#"+tem_onedata,
        "displayText": "「"+ tem_one + "」" + "を選択しました"
      },
                 {
                   "type": "postback",
                   "label": tem_two,
                   "data": data_col+"#"+tem_twodata,
                   "displayText": "「"+ tem_two + "」" + "を選択しました"
                 },
                 {
                   "type": "postback",
                   "label": tem_three,
                   "data": data_col+"#"+tem_threedata,
                   "displayText": "「"+ tem_three + "」" + "を選択しました"
                 }
                ];
    }
    
                     
    
    var postData = {
      "to": id,
      "messages": [{
        "type": "template",
        "altText": tem_title,
        "template":{
          "type":"buttons",
          "thumbnailImageUrl": tem_image,
          "title": tem_title,
          "text": tem_description,
          "actions": actions
        }
      }]
    };
    var options = {
      "method": "post",
      "headers": headers,
      "payload": JSON.stringify(postData)
    };
    if(data_col != 0){
      UrlFetchApp.fetch(url, options);
    }else{
      this.send_line(this.line.source.userId,"データシートにイベントが登録されていません");
    }
  };
  
  
  this.send_confirm = function(id,content){
    var confirm_sheet = new sheet("confirm");
    var confirm_num;
    var url = "https://api.line.me/v2/bot/message/push";
    var headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + this.token,
    };
    var eachcontent;
    var eachdata;
    if(typeof content == "object"){
      if(content[0] == "name"){
        confirm_num = 1;
        eachdata = content[1];
        eachcontent = content[1]+"さんでよろしいですか？";
      }
      //this.send_confirm(userId,["name",this.line.message.text]);
    }else{
      confirm_num = content;
    }
    var con_num_row      = confirm_sheet.find_row(1,confirm_num);
    var con_time         = confirm_sheet.getvalue(con_num_row,2);
    var con_eventname    = confirm_sheet.getvalue(con_num_row,3);
    var con_description  = eachcontent || confirm_sheet.getvalue(con_num_row,4);
    var con_one          = confirm_sheet.getvalue(con_num_row,5);
    var con_onedata      = eachdata || confirm_sheet.getvalue(con_num_row,6);
    var con_two          = confirm_sheet.getvalue(con_num_row,7);
    var con_twodata      = confirm_sheet.getvalue(con_num_row,8);
    var con_ext          = confirm_sheet.getvalue(con_num_row,9);
    var data_col = this.sh.find_col(tableentry_row, con_eventname);
    
    var postData = {
      "to": id,
      "messages": [{
        "type": "template",
        "altText": con_description,
        "template": {
          "type":"confirm",
          "text": con_description,
          "actions":[
            {
                "type": "postback",
                "label": con_one,
                "data": data_col+"#"+con_onedata+"#"+con_ext,
              "displayText": con_one
            },
            {
                "type": "postback",
                "label": con_two,
              "data": data_col+"#"+con_twodata+"#"+con_ext,
              "displayText": con_two
            }
          ]
        }
      }] 
    };
    var options = {
      "method": "post",
      "headers": headers,
      "payload": JSON.stringify(postData)
    };
    if(data_col != 0){
      UrlFetchApp.fetch(url, options);
    }else{
      this.send_line(this.line.source.userId,"データシートにイベントが登録されていません");
    }
  };
};

/**
* Post Slack Class.
*/
var slack = function () {
  var token = slack_access_token;
  this.slackApp = SlackApp.create(token);
  this.channels = '#linetoslack';

  /**
  * Post Slack message.
  */
  this.postSlackMessage = function (mes, profile) {
    var options;
    if (profile != undefined) {
      options = {
        username: profile.displayName,
        icon_url: profile.pictureUrl
      };
    }
    this.slackApp.postMessage(this.channels, mes, options);
  };

  /**
  * Post Slack Files.
  */
  this.postSlackFiles = function (image) {
    var options = {
      channels: this.channels
    };
    this.slackApp.filesUpload(image, options);
  };
};
