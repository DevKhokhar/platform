/**
 * Message List View
 *
 * @module     MessageListView
 * @author     Ushahidi Team <team@ushahidi.com>
 * @copyright  2013 Ushahidi
 * @license    https://www.gnu.org/licenses/agpl-3.0.html GNU Affero General Public License Version 3 (AGPL3)
 */

define(['App', 'marionette', 'handlebars','underscore', 'views/MessageListItemView',
		'text!templates/MessageList.html', 'text!templates/partials/pagination.html', 'text!templates/partials/post-list-info.html'],
	function( App, Marionette, Handlebars, _, MessageListItemView,
		template, paginationTemplate, postListInfoTemplate)
	{
		Handlebars.registerPartial('pagination', paginationTemplate);
		Handlebars.registerPartial('post-list-info', postListInfoTemplate);

		return Marionette.CompositeView.extend(
		{
			//Template HTML string
			template: Handlebars.compile(template),
			// Lets just store the partial templates somewhere useful
			partialTemplates :
			{
				pagination : Handlebars.compile(paginationTemplate),
				postListInfo : Handlebars.compile(postListInfoTemplate)
			},
			initialize: function()
			{
			},

			itemView: MessageListItemView,
			itemViewOptions: {},

			itemViewContainer: '.list-view-message-list',

			events:
			{
				'click .js-list-view-select' : 'showHideBulkActions',
				'click .js-page-first' : 'showFirstPage',
				'click .js-page-next' : 'showNextPage',
				'click .js-page-prev' : 'showPreviousPage',
				'click .js-page-last' : 'showLastPage',
				'click .js-page-change' : 'showPage',
				'change #filter-count' : 'updatePageSize',
				'change #filter-sort' : 'updatePostsSort',
        'click .js-message-filter-all' : 'filterByMessageType',
        'click .js-card-action-reply' : 'toggleReply',
        'click .js-card-action-expand' : 'toggleMessageActivity',
        'click .js-card-action-location' : 'toggleMap',
        'click .excerpt, .show-full-message' : 'showFullMessage',
        'click .card-actions-list__item a' : 'toggleActiveClass'

			},

			collectionEvents :
			{
				reset : 'updatePagination',
				add : 'updatePagination',
				remove : 'updatePagination'
			},

			showHideBulkActions : function ()
			{
				var $checked = this.$('.js-list-view-select input[type="checkbox"]:checked');

				if ($checked.length > 0)
				{
					this.$('.js-list-view-bulk-actions').removeClass('visually-hidden');
					this.$('.js-list-view-bulk-actions').addClass('visible');
				}
				else
				{
					this.$('.js-list-view-bulk-actions').removeClass('visible');
					this.$('.js-list-view-bulk-actions').addClass('visually-hidden');
				}
			},

			serializeData : function ()
			{
				var data = { items: this.collection.toJSON() };
				data = _.extend(data, {
					pagination: this.collection.state,
					sortKeys: this.collection.sortKeys
				});

				return data;
			},

			showNextPage : function (e)
			{
				e.preventDefault();
				// Already at last page, skip
				if (this.collection.state.lastPage <= this.collection.state.currentPage)
				{
					return;
				}

				this.collection.getNextPage();
				this.updatePagination();
			},
			showPreviousPage : function (e)
			{
				e.preventDefault();
				// Already at last page, skip
				if (this.collection.state.firstPage >= this.collection.state.currentPage)
				{
					return;
				}

				this.collection.getPreviousPage();
				this.updatePagination();
			},
			showFirstPage : function (e)
			{
				e.preventDefault();
				// Already at last page, skip
				if (this.collection.state.firstPage >= this.collection.state.currentPage)
				{
					return;
				}

				this.collection.getFirstPage();
				this.updatePagination();
			},
			showLastPage : function (e)
			{
				e.preventDefault();
				// Already at last page, skip
				if (this.collection.state.lastPage <= this.collection.state.currentPage)
				{
					return;
				}

				this.collection.getLastPage();
				this.updatePagination();
			},
			showPage : function (e)
			{
				var $el = this.$(e.currentTarget),
						num = 0;

				e.preventDefault();

				_.each(
					$el.attr('class').split(' '),
					function (v) {
						if (v.indexOf('page-') === 0)
						{
							num = v.replace('page-', '');
						}
					}
				);
				this.collection.getPage(num -1);
				this.updatePagination();
			},

			updatePagination: function ()
			{
				this.$('.pagination').replaceWith(
					this.partialTemplates.pagination({
						pagination: this.collection.state
					})
				);
				this.$('.list-view-filter-info').html(
					this.partialTemplates.postListInfo({
						pagination: this.collection.state
					})
				);
			},
			updatePageSize : function (e)
			{
				e.preventDefault();
				var size = parseInt(this.$('#filter-count').val(), 10);
				if (typeof size === 'number' && size > 0)
				{
					this.collection.setPageSize(size, {
						first: true
					});
				}
			},
			updatePostsSort : function (e)
			{
				e.preventDefault();
				var orderby = this.$('#filter-sort').val();
				this.collection.setSorting(orderby);
				this.collection.getFirstPage();
			},
      filterByMessageType : function(e)
      {
        e.preventDefault();

        var $el = this.$(e.currentTarget),
          role = $el.attr('data-role-name');

        App.Collections.Users.setFilterParams({
          role : role
        });

        $el.closest('.js-filter-categories-list')
          .find('li')
            .removeClass('active')
            .find('.message-type > span').addClass('visually-hidden')
            .end()
          .filter('li[data-role-name=""]')
            .addClass('active')
            .find('.message-type > span').removeClass('visually-hidden');
      },
      toggleReply : function(e)
      {
        e.preventDefault();
        this.$(e.currentTarget).closest('.card-actions-wrapper').nextAll('.js-card-panel-reply').slideToggle(200);
      },
      toggleMessageActivity : function(e)
      {
				e.preventDefault();
							this.$(e.currentTarget).closest('.card-actions-wrapper').nextAll('.js-card-panel-expand').slideToggle(200);
      },
      toggleMap : function(e)
      {
				e.preventDefault();

				this.$(e.currentTarget).closest('.card').prevAll('.js-card-panel-map').slideToggle(200);
      },
      showFullMessage : function(e)
      {
        e.preventDefault();

this.$(e.currentTarget).closest('.card__excerpt').toggleClass('show').find('.show-full-message i').toggleClass('fa-angle-double-down').toggleClass('fa-angle-double-up');

var that = this.$(e.currentTarget).closest('.card__excerpt');

				if (that.hasClass('show')) {
					that.find('.elipsis').hide(0);
					that.find('.full-message').delay(100).fadeIn(200);
				}
				else {
					that.find('.elipsis').delay(300).show(0);
					that.find('.full-message').fadeOut(200);
				}
      },
      toggleActiveClass : function(e)
      {
        e.preventDefault();

        this.$(e.currentTarget).toggleClass('active');
      }
		});
	});
