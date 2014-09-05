/**
 * Bookmark model
 */
var types = require('../../node_modules/tqtopicmap/lib/types')
  , icons = require('../../node_modules/tqtopicmap/lib/icons')
  , properties = require('../../node_modules/tqtopicmap/lib/properties')

  , constants = require('../../core/constants')
  , uuid = require('../../core/util/uuidutil')
  , tagmodel = require('../tag/tagmodel');

var BookmarkModel =  module.exports = function(environment) {
	var myEnvironment = environment;
	var CommonModel = environment.getCommonModel();
	var PortalNodeModel = environment.getPortalNodeModel();
	var topicMapEnvironment = environment.getTopicMapEnvironment();
	var DataProvider = topicMapEnvironment.getDataProvider();
	var TopicModel = topicMapEnvironment.getTopicModel();
	var TagModel = new tagmodel(environment);
	var queryDSL = topicMapEnvironment.getQueryDSL();
	var self = this;
  
	self.getBookmarkByURL = function(url, credentials, callback) {
		DataProvider.getNodeByURL(url,credentials, function(err,data) {
			console.log('BookmarkModel.getNodeByURL '+url+" "+err+" "+data);
		});
	},
	/**
	 * Update an existing node; no tags included
	 */
	self.update = function(json,user,callback) {
		PortalNodeModel.update(json,user,function(err,result) {
			callback(err,null);
		});
	},
	
	  /**
	   * Update an existing blog entry; no tags included
	   * /
	  self.update = function(blog,user,credentials,callback) {
		  myEnvironment.logDebug("Bookmark.UPDATE "+JSON.stringify(blog));
		  var lox = blog.locator;
		  DataProvider.getNodeByLocator(lox, credentials, function(err,result) {
			  var error = '';
			  if (err) {error += err;}
			  var title = blog.title;
			  var body = blog.body;
	    	  var lang = blog.language;
	    	  var comment = "an edit by "+user.handle;
	    	  if (!lang) {lang = "en";}
			  var isNotUpdateToBody = true;
	    	  var lang = blog.language;
	    	  if (!lang) {lang = "en";}
	    	  var oldBody;
	    	  if(result.getBody(lang)) {
	    		  oldBody = result.getBody(lang).theText;
	    	  }
	    	  myEnvironment.logDebug("Bookmark.UPDATE-1 "+oldBody+" | "+body);
	    	  if (!oldBody) {
	    		  oldBody="";
	    	  }
	    	  isNotUpdateToBody = (oldBody === body);
	    	  var oldLabel = result.getSubject(lang).theText;
	    	  var isNotUpdateToLabel = (title === oldLabel);
	    	  myEnvironment.logDebug("Bookmark.UPDATE-2 "+isNotUpdateToLabel+" | "+isNotUpdateToLabel);
	    	  if (!isNotUpdateToLabel) {
	    		  //crucial update to label
	    		  result.updateSubject(title,lang,user.handle,comment);
	    		  if (!isNotUpdateToBody) {
	    			  result.updateBody(body,lang,user.handle,comment);
	    		  }
		    	  result.setLastEditDate(new Date());
		    	  DataProvider.updateNodeLabel(result, oldLabel, title, credentials, function(err,data) {
		    		  if (err) {error += err;}
		    		  console.log("BookmarkModel.update "+error+" "+oldLabel+" "+title);
		    		  callback(error,data);
		    	  });
	    	  } else {
	    		  if (!isNotUpdateToBody) {
	    			  result.updateBody(body,lang,user.handle,comment);
	    			  result.setLastEditDate(new Date());
			    	  DataProvider.putNode(result, function(err,data) {
			    		  if (err) {error += err;}
			    		  callback(error,data);
			    	  });
	    		  } else {
	    			  callback(error,null);
	    		  }
	    	  };
		  });
	  },
	  */
	self.createAnnotationAndTags = function(bookmarkNode, blog, userTopic, credentials, callback) {
		myEnvironment.logDebug("BBBB "+JSON.stringify(userTopic));
		//TODO create the position node
		//copy from conversationmodel (move to common model?)
		//Deal with tags
  	  var lang = blog.language;
	    var url = blog.url;

	  if (!lang) {lang = "en";}
		var error = '';
		myEnvironment.logDebug("BookmarkModel.createAnnotationAndTags "+bookmarkNode.toJSON());
		//contextLocator, parentNode,newLocator, 
		//nodeType, subject, body, language, smallIcon, largeIcon,
		//  credentials, userLocator, isPrivate, callback
		TopicModel.createTreeNode(bookmarkNode.getLocator(),bookmarkNode,"",types.NOTE_TYPE,
	    		  blog.subject, blog.body, lang, icons.NOTE_SM, icons.NOTE,
	    		  credentials, userTopic.getLocator(), false, function(err,data) {
			var positionNode = data;
			positionNode.setResourceUrl(url);
			  myEnvironment.addRecentConversation(positionNode.getLocator(),blog.subject);
			if (err) {error += err;}
			var taglist = CommonModel.makeTagList(blog);
	        if (taglist.length > 0) {
	          TagModel.processTagList(taglist, userTopic, positionNode, credentials, function(err,result) {
	            console.log('NEW_POST-1 '+result);
	            //result could be an empty list;
	            //TagModel already added Tag_Doc and Doc_Tag relations
	            console.log("ARTICLES_CREATE_2 "+JSON.stringify(positionNode));
	            DataProvider.putNode(positionNode, function(err,data) {
	              console.log('ARTICLES_CREATE-3 '+err);	  
	  			  if (err) {error += err;}
	              if (err) {console.log('ARTICLES_CREATE-3a '+err)}
	              console.log('ARTICLES_CREATE-3b '+userTopic);	  
	
	              TopicModel.relateExistingNodesAsPivots(userTopic,positionNode,types.CREATOR_DOCUMENT_RELATION_TYPE,
	              		userTopic.getLocator(),
	                    		icons.RELATION_ICON, icons.RELATION_ICON, false, false, credentials, function(err,data) {
	      			if (err) {error += err;}
	                  if (err) {console.log('ARTICLES_CREATE-3d '+err);}
		              callback(error,positionNode.getLocator());
	               }); //r1
	            }); //putnode 		  
	      	  }); // processtaglist
	        } else {
	            DataProvider.putNode(positionNode, function(err,data) {
		              console.log('ARTICLES_CREATE-3 '+err);	  
		  			  if (err) {error += err;}
		              if (err) {console.log('ARTICLES_CREATE-3a '+err)}
		              console.log('ARTICLES_CREATE-3b '+userTopic);	  
		
		              TopicModel.relateExistingNodesAsPivots(userTopic,positionNode,types.CREATOR_DOCUMENT_RELATION_TYPE,
		              		userTopic.getLocator(),
		                    		icons.RELATION_ICON, icons.RELATION_ICON, false, false, credentials, function(err,data) {
		      			if (err) {error += err;}
		                  if (err) {console.log('ARTICLES_CREATE-3d '+err);}
			              callback(error,positionNode.getLocator());
		               }); //r1
		            }); //putnode 		  

	        }
		});
	},
	/**
	 * This is a bookmark. A bookmark for this URL might already exist.
	 * If so, we simply add a new AIR to it. Bookmark form has URL, title, subject, body, tags.
	 * If the bookmark doesn't exist, create it.
	 * Given the bookmark, then create a Position node with it as the conversation root.
	 */
	  self.create = function (blog, user, credentials, callback) {
		  console.log('BOOKMARK.create '+JSON.stringify(blog));
		// some really wierd shit: the User object for the user database stores
		// as user.handle, but passport seems to muck around and return user.username
	    var userLocator = user.handle; // It's supposed to be user.handle;
	    //first, fetch this user's topic
	    var url = blog.url;
	    var userTopic
	      , bookmarkTopic;
	    var error = '';
	    //get the user
	    DataProvider.getNodeByLocator(userLocator, credentials, function(err,utpx) {
	      userTopic = utpx;
	      if (err) {error+=err;}
	      myEnvironment.logDebug('BookmarkModel.create- '+userLocator+' | '+userTopic.toJSON());
	      //see if the bookmark exists
	      DataProvider.getNodeByURL(url, credentials, function(err,dNode) {
		      if (err) {error+=err;}
		      var lox;
		      //test data to see if it's a proxy
		      try {
		    	  lox = dNode.getLocator();
		      } catch (err) {}
		      myEnvironment.logDebug("BookmarkModel.create-1 "+url+" "+lox);
		      if (lox) {
		    	  bookmarkTopic = dNode;
		    	  //MAKE POSITION
		    	  //TAGS to Bookmark and Position
		    	  self.createAnnotationAndTags(bookmarkTopic,blog,userTopic,credentials, function(err,result) {
				      if (err) {error+=err;}
		    		  callback(error,result);
		    	  });
		      } else {
		    	  //create the bookmark
			      TopicModel.newInstanceNode(uuid.newUUID(), types.BOOKMARK_TYPE,
				      		"", "", constants.ENGLISH, userLocator,
				      		icons.BOOKMARK_SM, icons.BOOKMARK, false, credentials, function(err, article) {
			    	  myEnvironment.logDebug("BookmarkModel.create-2 "+err+" "+article);
				      if (err) {error+=err;}
				      bookmarkTopic = article;
			    	  var lang = blog.language;
			    	  if (!lang) {lang = "en";}
			    	  var subj = blog.title;
			    	  article.setSubject(subj,lang,userLocator);
			    	  article.setBody("",lang,userLocator);
			    	  article.setResourceUrl(url);
					  myEnvironment.addRecentBookmark(bookmarkTopic.getLocator(),blog.title);
					  DataProvider.putNode(bookmarkTopic, function(err,data) {
					      if (err) {error+=err;}
					      TopicModel.relateExistingNodesAsPivots(userTopic,bookmarkTopic,types.CREATOR_DOCUMENT_RELATION_TYPE,
				              		userTopic.getLocator(),
				                  		icons.RELATION_ICON_SM, icons.RELATION_ICON, false, false, credentials, function(err,data) {
					  			  if (err) {error += err;}
					  			  //MAKE POSITION
					  			  //TAGS to Bookmark and Position
					  			  self.createAnnotationAndTags(bookmarkTopic,blog,userTopic,credentials, function(err,result) {
					  				  if (err) {error+=err;}
					  				  callback(error,result);
					  			  });
					      });
					  });
			      });
			  }
		    }); //getNodeByURL  	  
	      }); //getNodeByLocator
	  },
	  
	  self.listBlogPosts = function(start, count, credentials, callback) {
	    var query = queryDSL.sortedDateTermQuery(properties.INSTANCE_OF,types.BOOKMARK_TYPE,start,count);
	    DataProvider.listNodesByQuery(query, start,count,credentials, function(err,data,total) {
	      console.log("BookmarkModel.listBlogPosts "+err+" "+data);
	      callback(err,data,total);
	    });
	  },
	  
	  /**
	   * @param credentials
	   * @param callback signature (html, length, total)
	   */
	  self.fillDatatable = function(start, count, credentials, callback) {
		  self.listBlogPosts(start,count,credentials,function(err,result,totalx) {
		      console.log('ROUTES/bookmark '+err+' '+result);
		      CommonModel.fillSubjectAuthorDateTable(result,"/bookmark/",totalx, function(html,len,total) {
			      console.log("FILLING "+start+" "+count+" "+total);
			      callback(html,len,total);
		    	  
		      });
		  });
	  }
};