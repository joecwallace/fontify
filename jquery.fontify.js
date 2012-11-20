/*!
 * jQuery Fontify plugin for browsing Google Web Fonts
 * Original author: @joecwallace
 * Licensed under the MIT license
 */

 ;(function($, window, document, undefined) {

  var pluginName = 'fontify',
    defaults = {
      apiKey: 'AIzaSyD14QrqNAfCOxBAr_jbSt_j0hNMKIFHsj8',
      position: 'top',
      
      activeOpacity: 0.9,
      inactiveOpacity: 0.2,
      margin: '16px'
    },
    zIndex = 500;

  function Fontify(selectors, options) {
    
    this.selectors = selectors;
    this.options = $.extend({}, defaults, options);

    this._defaults = defaults;
    this._name = pluginName;

    this.init();
    
  }

  Fontify.prototype.init = function() {
    
    this.selects = [];
    
    this.link = $('<link rel="stylesheet" href="" type="text/css" />');
    $('head').append(this.link);
    
    this.createWidget();
    this.fetchFonts();
    
  };
  
  Fontify.prototype.setFonts = function() {
    
    var that = this,
      fontFams = [];
    
    $.each(that.selects, function() {
      var selector = $(this).data('selector'),
        fontFam = $('option:selected', this).text(),
        fontFamFormat = fontFam.replace(' ', '+');
      
      if ($.inArray(fontFamFormat, fontFams) < 0) {
        fontFams.push(fontFamFormat);
      }
      
      $(selector).css('font-family', fontFam);
    });
    
    that.link.attr('href', 'http://fonts.googleapis.com/css?family=' + fontFams.join('|'));
    
  };
  
  Fontify.prototype.showUsage = function() {
    
    var that = this,
      body = $('body'),
      overlay = $('<div></div>'),
      modal = $('<div></div>'),
      closeBtn = $('<a href="#">&times;</a>'),
      headP = $('<p>In your <span style="font-style:italic;">&lt;head /&gt;</span>:</p>'),
      headPre = $('<pre></pre>'),
      stylesP = $('<p>In your styles:</p>'),
      stylesPre = $('<pre></pre>'),
      stylesContent = '',
      preCss = {
        background: '#f8f8f8',
        border: '1px solid #eee',
        'font-family': 'monospace',
        'margin-bottom': '24px',
        padding: '4px 8px'
      },
      closeFunc = function(evt) {
        evt.preventDefault();
        overlay.remove();
        modal.remove();
      };
    
    overlay.css({
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      background: '#000',
      opacity: 0.4,
      'z-index': zIndex + 1
    }).appendTo(body).click(closeFunc);
    
    closeBtn.css({
      position: 'absolute',
      top: 0,
      right: '8px',
      'font-size': '18px',
      'font-weight': 'bold'
    }).click(closeFunc);
    
    $.each(that.selects, function() {
      if (stylesContent.length) {
        stylesContent += '<br>';
      }
      
      stylesContent += $(this).data('selector') + ' {<br>&nbsp;&nbsp;font-family: ' + $('option:selected', this).text() + ';<br>}';
    });
    
    headPre.css(preCss).text(that.link[0].outerHTML);
    stylesPre.css(preCss).html(stylesContent);
    
    modal.append(closeBtn, headP, headPre, stylesP, stylesPre).css({
      position: 'fixed',
      bottom: '100%',
      left: '50%',
      background: '#fff',
      border: '1px solid #000',
      'box-shadow': '6px 6px 12px #888',
      padding: '32px',
      'z-index': zIndex + 2
    }).appendTo(body).css({
      'margin-left': (-modal.width() / 2) + 'px'
    }).animate({
      bottom: '50%',
      'margin-bottom': (-modal.height() / 2) + 'px'
    });
    
  };
  
  Fontify.prototype.createWidget = function() {
    
    var that = this,
      loading = $('<p>Loading...</p>'),
      widget = $('<div></div>'),
      borderCss = '1px solid #000';
    
    loading.css({ margin: that.options.margin });
    widget.css({
      position: 'fixed',
      left: '0',
      width: '100%',
      background: '#fff',
      'z-index': zIndex
    });
    
    switch (that.options.position) {
      case 'bottom':
        widget.css({ bottom: '0', 'border-top': borderCss });
        break;
      case 'top':
        // FALL THROUGH!!!
      default:
        widget.css({ top: '0', 'border-bottom': borderCss });
        break;
    }
    
    widget.mouseenter(function() {
      $(this).stop().fadeTo('fast', that.options.activeOpacity);
    });
    
    widget.mouseleave(function() {
      $(this).stop().fadeTo('fast', that.options.inactiveOpacity);
    });
    
    widget.append(loading)
      .appendTo($('body'))
      .fadeTo(2500, that.options.inactiveOpacity);
    
    that.widget = widget;
    return widget;
    
  };
  
  Fontify.prototype.createFontifier = function() {
    
    var that = this,
      fontifier = $('<div>FONTIFY</div>'),
      fontSelect = $('<select></select>'),
      fontOptions = that.getFontSelectOptions(),
      usageLink = $('<a href="#">Use fonts</a>'),
      separator = '&nbsp;//&nbsp;';
    
    fontSelect.html(fontOptions).css('margin', '0 8px 0 4px').change(function() {
      that.setFonts();
    });
    
    // Add a select element for each of the selectors provided by the user
    $.each(that.selectors, function(idx, val) {
      var select = fontSelect.clone(true).data('selector', val);
      
      that.selects.push(select);
      
      fontifier.append(separator + val)
        .append(select);
    });
    
    usageLink.click(function(evt) {
      evt.preventDefault();
      
      that.showUsage();
    });
    
    fontifier.attr('id', 'fontifier').css({ margin: that.options.margin })
      .append(separator).append(usageLink);
    
    that.widget.html(fontifier);
    
    that.fontifier = fontifier;
    return fontifier;
    
  };
  
  Fontify.prototype.fetchFonts = function() {
    
    var that = this;
    
    $.ajax({
      url: 'https://www.googleapis.com/webfonts/v1/webfonts',
      data: {
        key: that.options.apiKey
      },
      dataType: 'jsonp',
      success: function(data) {
        if (data.items) {
          that.fonts = data.items;
          that.loadFonts();
        }
        else {
          that.displayError(data.error.errors[0]);
        }
      },
      error: function(xhr, status, error) {
        console.log(error);
      }
    });
    
  };
  
  Fontify.prototype.loadFonts = function() {
    
    this.createFontifier();
    this.setFonts();
      
  };
  
  Fontify.prototype.getFontSelectOptions = function() {
    
    var options = '';
    
    $.each(this.fonts, function(idx, val) {
      options += '<option value="' + idx + '">' + val.family + '</option>';
    });
    
    return options;
    
  };
  
  Fontify.prototype.displayError = function(error) {
    
    var p = $('<p></p>'),
      message = 'Error: ' + error.message + ' (' + error.reason + ')';
    
    p.css({ color: '#f00', margin: this.options.margin }).text(message);
    
    this.widget.html(p);
    
  };

  $.fn[pluginName] = function(options) {

    new Fontify($.map(this.selector.split(','), $.trim), options);

  }

 }(jQuery, window, document));
