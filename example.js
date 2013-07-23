define(function(require) {
    var Hub = require('streamhub-sdk');
    var StreamHelper = require('streamhub-personalized');
    var StreamManager = require('streamhub-sdk/stream-manager');
    var LivefyreStream = require('streamhub-sdk/streams/livefyre-stream');
    var View = require('streamhub-sdk/views/list-view');
    var LivefyreAuthClient = require('streamhub-sdk/clients/livefyre-auth-client');
    var LivefyreWriteClient = require('streamhub-sdk/clients/livefyre-write-client');

    return function(el) {
        var streamOpts = [{
            network: "labs.fyre.co",
            siteId: "315833",
            articleId: 'labs_demo_basketball',
            title: 'Basketball'
        },{
            network: "labs.fyre.co",
            siteId: "315833",
            articleId: 'labs_demo_football',
            title: 'Football'
        },{
            network: "labs.fyre.co",
            siteId: "315833",
            articleId: 'labs_demo_social_baseball',
            title: 'Baseball'
        },{
            network: "labs.fyre.co",
            siteId: "315833",
            articleId: 'labs_demo_soccer',
            title: 'Soccer'
        }];
        
        var token = "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzc3MjE0MzkxLjIyMDY5LCAidXNlcl9pZCI6ICJzeXN0ZW0ifQ.E2NHoRvIPVxXdIPRJkqEby9ulLuyIwODTJyqnEriN1k";
        var profileId = "system@labs.fyre.co";
        var view = new View({el: el});
        var viewWrapper = {};
        viewWrapper.add = function(content, stream) {
            if ($.inArray(profileId, stream.followers) >= 0) {
                view.add(content, stream);
            } else {
                console.log('content rejected from', stream.articleId);
            }
        };
        var streamManager = window.streamManager = new StreamManager({}).bind(viewWrapper);
        var followsDiv = $('#follows');
        
        var followClick = function(ev) {
            var id = $(ev.target).attr('data-streamId');
            var stream = streamManager.get('main_' + id);
            
            if ($(ev.target).hasClass('follow')) {
                follow($(ev.target));
                LivefyreWriteClient.follow($.extend({lftoken: token}, stream.opts));
            } else {
                unfollow($(ev.target));
                LivefyreWriteClient.unfollow($.extend({lftoken: token}, stream.opts));
            }
        };

        var follow = function(link) {
            var id = link.attr('data-streamId');
            link.removeClass('follow');
            link.text('Unfollow');
            link.addClass('unfollow');
        };

        var unfollow = function(link) {
            var id = link.attr('data-streamId');
            link.removeClass('unfollow');
            link.text('Follow');
            link.addClass('follow');
        };
        
        LivefyreAuthClient.getAuthData(streamOpts[0], function(authErr, authData) {
            profileId = profileId || (((authData || {}).data || {}).profile || {}).id;
            token = token || (((authData || {}).data || {}).token || {}).value;
        
	        for (var i = 0; i < streamOpts.length; i++) {
	            var holder = $('<div></div>').text(streamOpts[i].title);
	                
	            var link = $('<a>Follow</a>')
	                .addClass('follow')
	                .click(followClick)
	                .attr('data-streamId', streamOpts[i].articleId)
	                .appendTo(holder);

	            (function(holder, link, opts) {
		            Hub.StreamManager.create.livefyreStreams(opts).on('add', function(name, stream) {
                        streamManager.set(name + "_" + opts.articleId, stream);
                        stream.on('followers', function(streamIn) {
                            if ($.inArray(profileId, streamIn.followers) >= 0) {
                                follow(link);
                            } else {
                                unfollow(link);
                            }
                        });

		                if (name == "main") {
		                   if ($.inArray(profileId, stream.followers) >= 0) {
		                       follow(link);
		                   }
		                   stream.start();
		                } else {
		                    setTimeout(function() {
                                holder.appendTo(followsDiv);
			                    var mainStream = streamManager.get('main_' + opts.articleId);
			                    if (mainStream && $.inArray(profileId, mainStream.followers) >= 0) {
			                        stream.start();
			                    }
		                    }, 800);
		                }
                        
		            });
	            }(holder, link, streamOpts[i]));
	        }
        });
        return view;
    };
});
