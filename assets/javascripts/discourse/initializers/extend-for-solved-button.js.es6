import PostView from 'discourse/views/post';
import PostMenuComponent from 'discourse/components/post-menu';
import { Button } from 'discourse/components/post-menu';
import Topic from 'discourse/models/topic';
import User from 'discourse/models/user';
import TopicStatus from 'discourse/views/topic-status';
import { popupAjaxError } from 'discourse/lib/ajax-error';
import { withPluginApi } from 'discourse/lib/plugin-api';

function clearAccepted(topic) {
  const posts = topic.get('postStream.posts');
  posts.forEach(post => {
    if (post.get('post_number') > 1 ) {
      post.set('expired_deal',false);
      post.set('can_mark_deal_expired',true);
      post.set('can_unmark_deal_expired',false);
    }
  });
}

function unexpired_markPost(post) {
  if (!post.get('can_unmark_deal_expired')) { return; }
  const topic = post.topic;

  post.setProperties({
    can_mark_deal_expired: true,
    can_unmark_deal_expired: false,
    expired_deal: false
  });
  topic.set('expired_deal', undefined);

  Discourse.ajax("/expired_deal/unexpired_mark", {
    type: 'POST',
    data: { id: post.get('id') }
  }).catch(popupAjaxError);
}

function expired_markPost(post) {
  const topic = post.topic;

  clearAccepted(topic);

  post.setProperties({
    can_unmark_deal_expired: true,
    can_mark_deal_expired: false,
    expired_deal: true
  });

  topic.set('expired_deal', {
    username: post.get('username'),
    post_number: post.get('post_number')
  });

  Discourse.ajax("/expired_deal/expired_mark", {
    type: 'POST',
    data: { id: post.get('.id') }
  }).catch(popupAjaxError);
}

// Code for older discourse installs for backwards compatibility
function oldPluginCode() {
  PostView.reopen({
    classNameBindings: ['post.expired_deal:expired_marked-answer']
  });

  PostMenuComponent.registerButton(function(visibleButtons){
    var position = 0;

    var canAccept = this.get('post.can_mark_deal_expired');
    var canUnexpired_mark = this.get('post.can_unmark_deal_expired');
    var expired_marked = this.get('post.expired_deal');
    var isOp = Discourse.User.currentProp("id") === this.get('post.topic.user_id');

    if  (!expired_marked && canAccept && !isOp) {
      // first hidden position
      if (this.get('collapsed')) { return; }
      position = visibleButtons.length - 2;
    }
    if (canAccept) {
      visibleButtons.splice(position,0,new Button('expired_markAnswer', 'expired.mark_deal_expired', 'check-square-o', {className: 'unexpired_marked'}));
    }
    if (canUnexpired_mark || expired_marked) {
      var locale = canUnexpired_mark ? 'expired.unmark_deal_expired' : 'expired.expired_deal';
      visibleButtons.splice(position,0,new Button(
          'unexpired_markAnswer',
          locale,
          'check-square',
          {className: 'expired_marked fade-out', prefixHTML: '<span class="expired_marked-text">' + I18n.t('expired.expired_deal') + '</span>'})
        );
    }

  });

  PostMenuComponent.reopen({
    expired_markedChanged: function() {
      this.rerender();
    }.observes('post.expired_deal'),

    clickUnexpired_markAnswer() {
      unexpired_markPost(this.get('post'));
    },

    clickAcceptAnswer() {
      expired_markPost(this.get('post'));
    }
  });
}

function initializeWithApi(api) {
  const currentUser = api.getCurrentUser();

  api.includePostAttributes('can_mark_deal_expired', 'can_unmark_deal_expired', 'expired_deal');

  api.addPostMenuButton('expired', attrs => {
    const canAccept = attrs.can_mark_deal_expired;
    const canUnexpired_mark = attrs.can_unmark_deal_expired;
    const expired_marked = attrs.expired_deal;
    const isOp = currentUser && currentUser.id === attrs.user_id;
    const position = (!expired_marked && canAccept && !isOp) ? 'second-last-hidden' : 'first';

    if (canAccept) {
      return {
        action: 'expired_markAnswer',
        icon: 'check-square-o',
        className: 'unexpired_marked',
        title: 'expired.mark_deal_expired',
        position
      };
    } else if (canUnexpired_mark || expired_marked) {
      const title = canUnexpired_mark ? 'expired.unmark_deal_expired' : 'expired.expired_deal';
      return {
        action: 'unexpired_markAnswer',
        icon: 'check-square',
        title,
        className: 'expired_marked fade-out',
        position,
        beforeButton(h) {
          return h('span.expired_marked-text', I18n.t('expired.expired_deal'));
        }
      };
    }
  });

  api.decorateWidget('post-contents:after-cooked', dec => {
    if (dec.attrs.post_number === 1) {
      const topic = dec.getModel().get('topic');
      if (topic.get('expired_deal')) {
        return dec.rawHtml(`<p class="expired">${topic.get('expired_markedAnswerHtml')}</p>`);
      }
    }
  });

  api.attachWidgetAction('post', 'expired_markAnswer', function() {
    const post = this.model;
    const current = post.get('topic.postStream.posts').filter(p => {
      return p.get('post_number') === 1 || p.get('expired_deal');
    });
    expired_markPost(post);

    current.forEach(p => this.appEvents.trigger('post-stream:refresh', { id: p.id }));
  });

  api.attachWidgetAction('post', 'unexpired_markAnswer', function() {
    const post = this.model;
    const op = post.get('topic.postStream.posts').find(p => p.get('post_number') === 1);
    unexpired_markPost(post);
    this.appEvents.trigger('post-stream:refresh', { id: op.get('id') });
  });
}

export default {
  name: 'extend-for-expired-button',
  initialize() {

    Topic.reopen({
      // keeping this here cause there is complex localization
      expired_markedAnswerHtml: function() {
        const username = this.get('expired_deal.username');
        const postNumber = this.get('expired_deal.post_number');

        if (!username || !postNumber) {
          return "";
        }

        return I18n.t("expired.expired_marked_html", {
          username_lower: username.toLowerCase(),
          username,
          post_path: this.get('url') + "/" + postNumber,
          post_number: postNumber,
          user_path: User.create({username: username}).get('path')
        });
      }.property('expired_deal', 'id')
    });

    TopicStatus.reopen({
      statuses: function(){
        const results = this._super();
        if (this.topic.has_expired_deal) {
          results.push({
            openTag: 'span',
            closeTag: 'span',
            title: I18n.t('expired.has_expired_deal'),
            icon: 'check-square-o'
          });
        }
        return results;
      }.property()
    });

    withPluginApi('0.1', initializeWithApi, { noApi: oldPluginCode });
  }
};
