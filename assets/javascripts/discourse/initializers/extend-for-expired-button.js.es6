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
      post.set('can_set_expire',true);
      post.set('can_unset_expire',false);
    }
  });
}

function unacceptPost(post) {
  if (!post.get('can_unset_expire')) { return; }
  const topic = post.topic;

  post.setProperties({
    can_set_expire: true,
    can_unset_expire: false,
    expired_deal: false
  });
  topic.set('expired_deal', undefined);

  Discourse.ajax("/solution/unaccept", {
    type: 'POST',
    data: { id: post.get('id') }
  }).catch(popupAjaxError);
}

function acceptPost(post) {
  const topic = post.topic;

  clearAccepted(topic);

  post.setProperties({
    can_unset_expire: true,
    can_set_expire: false,
    expired_deal: true
  });

  topic.set('expired_deal', {
    username: post.get('username'),
    post_number: post.get('post_number')
  });

  Discourse.ajax("/solution/accept", {
    type: 'POST',
    data: { id: post.get('.id') }
  }).catch(popupAjaxError);
}

// Code for older discourse installs for backwards compatibility
function oldPluginCode() {
  PostView.reopen({
    classNameBindings: ['post.expired_deal:accepted-answer']
  });

  PostMenuComponent.registerButton(function(visibleButtons){
    var position = 0;

    var canAccept = this.get('post.can_set_expire');
    var canUnaccept = this.get('post.can_unset_expire');
    var accepted = this.get('post.expired_deal');
    var isOp = Discourse.User.currentProp("id") === this.get('post.topic.user_id');

    if  (!accepted && canAccept && !isOp) {
      // first hidden position
      if (this.get('collapsed')) { return; }
      position = visibleButtons.length - 2;
    }
    if (canAccept) {
      visibleButtons.splice(position,0,new Button('acceptAnswer', 'expired.set_expire', 'check-square-o', {className: 'unaccepted'}));
    }
    if (canUnaccept || accepted) {
      var locale = canUnaccept ? 'expired.unset_expire' : 'expired.expired_deal';
      visibleButtons.splice(position,0,new Button(
          'unacceptAnswer',
          locale,
          'check-square',
          {className: 'accepted fade-out', prefixHTML: '<span class="accepted-text">' + I18n.t('expired.solution') + '</span>'})
        );
    }

  });

  PostMenuComponent.reopen({
    acceptedChanged: function() {
      this.rerender();
    }.observes('post.expired_deal'),

    clickUnacceptAnswer() {
      unacceptPost(this.get('post'));
    },

    clickAcceptAnswer() {
      acceptPost(this.get('post'));
    }
  });
}

function initializeWithApi(api) {
  const currentUser = api.getCurrentUser();

  api.includePostAttributes('can_set_expire', 'can_unset_expire', 'expired_deal');

  api.addPostMenuButton('expired', attrs => {
    const canAccept = attrs.can_set_expire;
    const canUnaccept = attrs.can_unset_expire;
    const accepted = attrs.expired_deal;
    const isOp = currentUser && currentUser.id === attrs.user_id;
    const position = (!accepted && canAccept && !isOp) ? 'second-last-hidden' : 'first';

    if (canAccept) {
      return {
        action: 'acceptAnswer',
        icon: 'check-square-o',
        className: 'unaccepted',
        title: 'expired.set_expire',
        position
      };
    } else if (canUnaccept || accepted) {
      const title = canUnaccept ? 'expired.unset_expire' : 'expired.expired_deal';
      return {
        action: 'unacceptAnswer',
        icon: 'check-square',
        title,
        className: 'accepted fade-out',
        position,
        beforeButton(h) {
          return h('span.accepted-text', I18n.t('expired.solution'));
        }
      };
    }
  });

  api.decorateWidget('post-contents:after-cooked', dec => {
    if (dec.attrs.post_number === 1) {
      const topic = dec.getModel().get('topic');
      if (topic.get('expired_deal')) {
        return dec.rawHtml(`<p class="expired">${topic.get('acceptedAnswerHtml')}</p>`);
      }
    }
  });

  api.attachWidgetAction('post', 'acceptAnswer', function() {
    const post = this.model;
    const current = post.get('topic.postStream.posts').filter(p => {
      return p.get('post_number') === 1 || p.get('expired_deal');
    });
    acceptPost(post);

    current.forEach(p => this.appEvents.trigger('post-stream:refresh', { id: p.id }));
  });

  api.attachWidgetAction('post', 'unacceptAnswer', function() {
    const post = this.model;
    const op = post.get('topic.postStream.posts').find(p => p.get('post_number') === 1);
    unacceptPost(post);
    this.appEvents.trigger('post-stream:refresh', { id: op.get('id') });
  });
}

export default {
  name: 'extend-for-expired-button',
  initialize() {

    Topic.reopen({
      // keeping this here cause there is complex localization
      acceptedAnswerHtml: function() {
        const username = this.get('expired_deal.username');
        const postNumber = this.get('expired_deal.post_number');

        if (!username || !postNumber) {
          return "";
        }

        return I18n.t("expired.accepted_html", {
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
