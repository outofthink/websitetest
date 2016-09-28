"use strict";
var RenderUrlsToFile, arrayOfUrls, system, startUrl, accessedUrls;

system = require("system");

var getHost = function(url) {
        var host = "null";
        if(typeof url == "undefined"
                        || null == url)
                url = window.location.href;
        var regex = /.*\:\/\/([^\/]*).*/;
        var match = url.match(regex);
        if(typeof match != "undefined"
                        && null != match)
                host = match[1];
        return host;
}


var urls = new Array();
var visitedUrls = new Array();
var fs = require('fs');
var errorUrls = "errorUrls.txt";
var successUrls = "successUrls.txt";
var notHtmlUrls = "notHtmlUrls.txt";
var jsErrors = "jsErrors.txt";
var fileid = 0;
var total = 0;
var t = Date.now();
var getFilename = function() {
  fileid=fileid+1;
  return "rendermulti-" + fileid + ".png";
};

if(system.args.length>1){
  startUrl=system.args[1];
  var domain=getHost(startUrl);
  urls.push(startUrl);
  scrapy();
  console.log(startUrl);
}else{
  console.log("Usage: phantomjs url");
}

function scrapy(){
  if(urls.length>0){
    total = total+1;
    var page = require("webpage").create();
    page.onConsoleMessage = function(msg) {
      console.log(msg);
    }
    //console.log(urls.length);
    var url = urls.shift();
    visitedUrls.push(url);
    var canOpen=true;
    page.onError=function(msg,trace){
      var msgStack=['ERROR: '+msg];
      if(trace && trace.length){
        msgStack.push('Trace:');
        trace.forEach(function(t){
          msgStack.push('->'+t.file+': '+t.line+(t.funtion ? ' (in function "'+t.function+'")':''));
        });
      }
      fs.write(jsErrors,msgStack.join('\n'),'a');
    };
    page.onResourceReceived=function(response){
      if(response.url==url){
        response.headers.forEach(function(header){
          if(header.name=="Content-Type"){
            if(header.value.indexOf("text")>=0){
              canOpen=true;
            }
            else{
              fs.write(notHtmlUrls,url+'\n','a');
              page.close();
            }
          }
        });
      }
    };
    //console.log(url);
    //console.log(canOpen);
    page.open(url,function(status){
      if(status==="success"&&canOpen==true){
        //page.render(getFilename());
        var links = page.evaluate(function(){
        var temp=new Array();
        var ls = document.links;
          for(var t=0;t<ls.length;t++){
            temp.push(ls[t].href);
          }
          return temp;
        });
        //console.log("total "+links.length);
        for(var i=0;i<links.length;i++){
          //console.log("i am" +i)
          if(links[i].indexOf(domain)>=0){
            //console.log(links[i]);
            var hasvisit=false;
            for(var j=0;j<visitedUrls.length;j++){
              if(links[i]==visitedUrls[j]){
                hasvisit=true;
                //console.log("i am break");
                break;
              }
            }
            var hasexist=false;
            for(var n=0;n<urls.length;n++){
              if(links[i]==urls[n]){
                hasexist=true;
              }
            }
            if(hasvisit==false && hasexist==false){
              urls.push(links[i]);
              //console.log("push"+links[i]);
            }
          }
        }
        page.close();
      }
    });
    page.onLoadFinished=function(status){
      if(status==="success"){
        console.log(urls.length);
        console.log(visitedUrls.length);
        //scrapy(urls);
        fs.write(successUrls,url+'\n','a');
      }
      else{
        fs.write(errorUrls,url+'\n','a');
        console.log("error: "+url);
        page.close()
      }
    };
    page.onClosing=function(closePage){
      scrapy();
    }
    //page.close();
  }
  else{
    t=Date.now()-t;
    console.log("average time a url load is "+t/total+" msec");
    phantom.exit();
  }
}
//phantom.exit();
