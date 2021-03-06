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

<<<<<<< HEAD
  Discourse.ajax("/exp/reopen", {
=======
  Discourse.ajax("/solution/unaccept", {
>>>>>>> parent of a1f944a... update
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

<<<<<<< HEAD
  Discourse.ajax("/exp/set_expired", {
=======
  Discourse.ajax("/solution/accept", {
>>>>>>> parent of a1f944a... update
    type: 'POST',
    data: { id: post.get('.id') }
  }).catch(popupAjaxError);
}

// Code for older discourse installs for backwards compatibility
function oldPluginCode() {
  PostView.reopen({
<<<<<<< HEAD
    classNameBindings: ['post.expired_deal:set_expired-answer']
=======
    classNameBindings: ['post.expired_deal:accepted-answer']
>>>>>>> parent of a1f944a... update
  });

  PostMenuComponent.registerButton(function(visibleButtons){
    var position = 0;

    var canAccept = this.get('post.can_set_expire');
<<<<<<< HEAD
    var canUnset_expired = this.get('post.can_unset_expire');
    var set_expired = this.get('post.expired_deal');
    var isOp = Discourse.User.currentProp("id") === this.get('post.topic.user_id');

    if  (!set_expired && canAccept && !isOp) {
=======
    var canUnaccept = this.get('post.can_unset_expire');
    var accepted = this.get('post.expired_deal');
    var isOp = Discourse.User.currentProp("id") === this.get('post.topic.user_id');

    if  (!accepted && canAccept && !isOp) {
>>>>>>> parent of a1f944a... update
      // first hidden position
      if (this.get('collapsed')) { return; }
      position = visibleButtons.length - 2;
    }
    if (canAccept) {
<<<<<<< HEAD
<<<<<<< HEAD
      visibleButtons.splice(position,0,new Button('set_expiredanswer', 'expired.set_expire', 'check-square-o', {className: 'reopened'}));
=======
      visibleButtons.splice(position,0,new Button('set_expiredAnswer', 'expired.set_expire', 'check-square-o', {className: 'reopened'}));
>>>>>>> parent of 38b3099... update
    }
    if (canUnset_expired || set_expired) {
      var locale = canUnset_expired ? 'expired.unset_expire' : 'expired.expired_deal';
      visibleButtons.splice(position,0,new Button(
<<<<<<< HEAD
          'reopenanswer',
=======
          'reopenAnswer',
>>>>>>> parent of 38b3099... update
          locale,
          'check-square',
          {className: 'set_expired fade-out', prefixHTML: '<span class="set_expired-text">' + I18n.t('expired.exp') + '</span>'})
=======
      visibleButtons.splice(position,0,new Button('acceptAnswer', 'expired.set_expire', 'check-square-o', {className: 'unaccepted'}));
    }
    if (canUnaccept || accepted) {
      var locale = canUnaccept ? 'expired.unset_expire' : 'expired.expired_deal';
      visibleButtons.splice(position,0,new Button(
          'unacceptAnswer',
          locale,
          'check-square',
          {className: 'accepted fade-out', prefixHTML: '<span class="accepted-text">' + I18n.t('expired.solution') + '</span>'})
>>>>>>> parent of a1f944a... update
        );
    }

  });

  PostMenuComponent.reopen({
<<<<<<< HEAD
    set_expiredChanged: function() {
      this.rerender();
    }.observes('post.expired_deal'),

<<<<<<< HEAD
    clickUnset_expiredanswer() {
      reopenPost(this.get('post'));
    },

    clickAcceptanswer() {
=======
    clickUnset_expiredAnswer() {
      reopenPost(this.get('post'));
    },

    clickAcceptAnswer() {
>>>>>>> parent of 38b3099... update
      set_expiredPost(this.get('post'));
=======
    acceptedChanged: function() {
      this.rerender();
    }.observes('post.expired_deal'),

    clickUnacceptAnswer() {
      unacceptPost(this.get('post'));
    },

    clickAcceptAnswer() {
      acceptPost(this.get('post'));
>>>>>>> parent of a1f944a... update
    }
  });
}

function initializeWithApi(api) {
  const currentUser = api.getCurrentUser();

  api.includePostAttributes('can_set_expire', 'can_unset_expire', 'expired_deal');

  api.addPostMenuButton('expired', attrs => {
    const canAccept = attrs.can_set_expire;
<<<<<<< HEAD
    const canUnset_expired = attrs.can_unset_expire;
    const set_expired = attrs.expired_deal;
    const isOp = currentUser && currentUser.id === attrs.user_id;
    const position = (!set_expired && canAccept && !isOp) ? 'second-last-hidden' : 'first';

    if (canAccept) {
      return {
<<<<<<< HEAD
        action: 'set_expiredanswer',
=======
        action: 'set_expiredAnswer',
>>>>>>> parent of 38b3099... update
=======
    const canUnaccept = attrs.can_unset_expire;
    const accepted = attrs.expired_deal;
    const isOp = currentUser && currentUser.id === attrs.user_id;
    const position = (!accepted && canAccept && !isOp) ? 'second-last-hidden' : 'first';

    if (canAccept) {
      return {
        action: 'acceptAnswer',
>>>>>>> parent of a1f944a... update
        icon: 'check-square-o',
        className: 'unaccepted',
        title: 'expired.set_expire',
        position
      };
<<<<<<< HEAD
    } else if (canUnset_expired || set_expired) {
      const title = canUnset_expired ? 'expired.unset_expire' : 'expired.expired_deal';
      return {
<<<<<<< HEAD
        action: 'reopenanswer',
=======
        action: 'reopenAnswer',
>>>>>>> parent of 38b3099... update
        icon: 'check-square',
        title,
        className: 'set_expired fade-out',
        position,
        beforeButton(h) {
          return h('span.set_expired-text', I18n.t('expired.exp'));
=======
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
>>>>>>> parent of a1f944a... update
        }
      };
    }
  });

  api.decorateWidget('post-contents:after-cooked', dec => {
    if (dec.attrs.post_number === 1) {
      const topic = dec.getModel().get('topic');
      if (topic.get('expired_deal')) {
<<<<<<< HEAD
<<<<<<< HEAD
        return dec.rawHtml(`<p class="expired">${topic.get('set_expiredanswerHtml')}</p>`);
=======
        return dec.rawHtml(`<p class="expired">${topic.get('set_expiredAnswerHtml')}</p>`);
>>>>>>> parent of 38b3099... update
=======
        return dec.rawHtml(`<p class="expired">${topic.get('acceptedAnswerHtml')}</p>`);
>>>>>>> parent of a1f944a... update
      }
    }
  });

<<<<<<< HEAD
<<<<<<< HEAD
  api.attachWidgetAction('post', 'set_expiredanswer', function() {
=======
  api.attachWidgetAction('post', 'set_expiredAnswer', function() {
>>>>>>> parent of 38b3099... update
=======
  api.attachWidgetAction('post', 'acceptAnswer', function() {
>>>>>>> parent of a1f944a... update
    const post = this.model;
    const current = post.get('topic.postStream.posts').filter(p => {
      return p.get('post_number') === 1 || p.get('expired_deal');
    });
    acceptPost(post);

    current.forEach(p => this.appEvents.trigger('post-stream:refresh', { id: p.id }));
  });

<<<<<<< HEAD
<<<<<<< HEAD
  api.attachWidgetAction('post', 'reopenanswer', function() {
=======
  api.attachWidgetAction('post', 'reopenAnswer', function() {
>>>>>>> parent of 38b3099... update
=======
  api.attachWidgetAction('post', 'unacceptAnswer', function() {
>>>>>>> parent of a1f944a... update
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
<<<<<<< HEAD
<<<<<<< HEAD
      set_expiredanswerHtml: function() {
=======
      set_expiredAnswerHtml: function() {
>>>>>>> parent of 38b3099... update
=======
      acceptedAnswerHtml: function() {
>>>>>>> parent of a1f944a... update
        const username = this.get('expired_deal.username');
        const postNumber = this.get('expired_deal.post_number');

        if (!username || !postNumber) {
          return "";
        }

<<<<<<< HEAD
        return I18n.t("expired.set_expired_html", {
=======
        return I18n.t("expired.accepted_html", {
>>>>>>> parent of a1f944a... update
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
