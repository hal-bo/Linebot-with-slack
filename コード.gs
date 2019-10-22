/*
var channel_access_token = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
var slack_access_token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
var verify_token = "Fyipv2gtjaUG1bNxtxlKM3Ho";

function doPost(e) {
  if (e.parameter.text != undefined) {
    sl_main(e);
  } else {
    ln_main(e);
  }
}
var sheet = function () {
  this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  this.sheet = this.spreadsheet.getSheets()[0];
  
  this.setvalue = function (row, column, value) {
    this.sheet.getRange(row, column).setValue(value);
  };


  this.getvalue = function (row, column) {
    var value = this.sheet.getRange(row, column).getValue();
    return value;
  };


  this.delete_row = function (row) {
    // for return 0
    try {
      this.sheet.deleteRow(row);
    } catch (e) {
      Logger.log(e);
    }
  };


  this.get_last_row = function () {
    return this.sheet.getLastRow();
  };


  this.find_row = function (column, value) {
    for (var row = 1; row <= this.get_last_row(); row++) {
      if (this.getvalue(row, column) == value) return row;
    }
    return 0;
  };

};

function sl_main(e){
  var id = '1wzQS69wX3pH8LGaRPMQe5i-qbK3190vean0T22OVFcQ'
  var sh = SpreadsheetApp.openById(id).getSheetByName('リスト');
  var text = get_slack_message(e.parameter);
  var userId;
  if (text[1] != undefined){
  }
  var bot_name = "LINEbot";
  var bot_icon = "http://i.imgur.com/DP2oyoM.jpg";
  var verify_token = "Fyipv2gtjaUG1bNxtxlKM3Ho";
  
  //投稿の認証
  if (verify_token != e.parameter.token) {
    throw new Error("invalid token.");
  }
  
  var app = SlackApp.create(slack_access_token);
  
  var text = get_slack_message(e.parameter);
  
  var message = e.parameter.user_name + "さんは「" + text + "」と言っています。";
  
  return app.postMessage("#general", message, {
    username: bot_name,
    icon_url: bot_icon
  });
}
function ln_main(e){
  var events = JSON.parse(e.postData.contents).events;
  events.forEach(function(event) {
    events.forEach(function(event) {
      switch (event.type) {
        case 'follow':
          var profile = get_line_profile(event);
          addUser(event.source.userId,profile);
          postSlackMessage(profile.displayName+'にフォローされました', profile);
          break;
        case 'unfollow':
          var profile = get_line_profile(event);
          deleteUser(event.source.userId,profile);
          postSlackMessage(profile.displayName+'にフォローをはずされました', profile);
          break;
        case 'message':
          var profile = get_line_profile(event);
          if(event.message.text == 'add'){
            addUser(event.source.userId,profile);
          }else if(event.message.text == 'delete'){
            deleteUser(event.source.userId,profile);
          }
          postSlackMessage(event.message.text, profile);
          postLineMessage(event.source.userId,event.replyToken, profile);
          break;
      }
    });
  });
}

function postSlackMessage(content,profile) {
 
  var slackApp = SlackApp.create(slack_access_token); //SlackApp インスタンスの取得
  
  if (profile != undefined) {
    var options = {
      username: profile.displayName,
      icon_url: profile.pictureUrl,
    };
  } else {
    var options = {
      userName: "linebot",
    };
  }
  //var channel = "@" + profile.displayName;
  slackApp.postMessage("@kbf53rd", content , options);
}
function postLineMessage(content, reply_token, profile){
  var message = {
    "replyToken" : reply_token,
    "messages" : [
      {
        "type" : "text",
        "text" : content
      }
    ]
  };
  var replyData = {
    "method" : "post",
    "headers" : {
      "Content-Type" : "application/json",
      "Authorization" : "Bearer " + channel_access_token
    },
    "payload" : JSON.stringify(message)
  };
  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", replyData);
}
function addUser(userId,profile){
  var id = '1wzQS69wX3pH8LGaRPMQe5i-qbK3190vean0T22OVFcQ'
  var sh = SpreadsheetApp.openById(id).getSheetByName('リスト');
  var last_raw = sh.getLastRow();
  sh.getRange(last_raw+1,1).setValue(last_raw);
  sh.getRange(last_raw+1,2).setValue(userId);
  sh.getRange(last_raw+1,3).setValue(profile.displayName);
}
function deleteUser(userId,profile){
  var id = '1wzQS69wX3pH8LGaRPMQe5i-qbK3190vean0T22OVFcQ'
  var sh = SpreadsheetApp.openById(id).getSheetByName('リスト');
  var last_raw = sh.getLastRow();
  sh.deleteRow(last_raw);
}
function getAttendance(){
  //var ss = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1wzQS69wX3pH8LGaRPMQe5i-qbK3190vean0T22OVFcQ/edit#gid=0&amp;vpid=A1');
  var id = '1wzQS69wX3pH8LGaRPMQe5i-qbK3190vean0T22OVFcQ'
  var sh = SpreadsheetApp.openById(id).getSheetByName('リスト');
  //var sheet = ss.getSheets()[0];
  var attendance = sh.getSheetValues(1,5,1,1);
  postSlackMessage("昨日までの参加希望者数は合計" + attendance + "名です。");
}
function get_slack_message(slack){
  var text;
  if(slack.trigger_word != undefined){
    text = slack.text.replace(slack.trigger_word, '');
  } else {
    text = slack.text;
  }
  text = text.split(/@([\w]*)/);
  return text;
}

function get_line_message(line) {
  switch (line.message.type) {
    case 'text':
      return line.message.text;
    case 'image':
      var blob = get_line_content(line.message.id);
      var file = DriveApp.createFile(blob);
      postSlackFiles(blob.getAs('image/png').setName('line.png'));
      return file.getUrl();
    case 'video':
      var blob = get_line_content(line.message.id);
      var file = DriveApp.createFile(blob);
      return file.getUrl();
    case 'audio':
      var blob = get_line_content(line.message.id);
      var file = DriveApp.createFile(blob);
      return file.getUrl();
    case 'file':
      var blob = get_line_content(line.message.id);
      var file = DriveApp.createFile(blob);
      return file.getUrl();
    case 'location':
      return '位置情報が送られた。';
    case 'sticker':
      return 'https://stickershop.line-scdn.net/stickershop/v1/sticker/' + line.message.stickerId + '/android/sticker.png';
    default:
      return 0;
  }
}

function get_line_content(message_id) {
  var headers = {
    'Authorization': 'Bearer ' + channel_access_token
  };
  var options = {
    'headers': headers
  };
  var url = 'https://api.line.me/v2/bot/message/' + message_id + '/content';
  var blob = UrlFetchApp.fetch(url, options);
  var imageBlob = blob.getAs('image/png').setName('chart_image.png');
  return blob;
}

function get_line_profile(line) {
  var token = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
  var headers = {
    'Authorization': 'Bearer ' + token
  };
  var options = {
    'headers': headers
  };
  var url;
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
  var response = UrlFetchApp.fetch(url, options);
  var content = JSON.parse(response.getContentText());
  return content; 
}
  
 function follow(e) {
  
}

function unFollow(e){
  
}
*/