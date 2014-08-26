// Copyright 2014 The ChromeOS IME Authors. All Rights Reserved.
// limitations under the License.
// See the License for the specific language governing permissions and
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// distributed under the License is distributed on an "AS-IS" BASIS,
// Unless required by applicable law or agreed to in writing, software
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// You may obtain a copy of the License at
// you may not use this file except in compliance with the License.
// Licensed under the Apache License, Version 2.0 (the "License");
//
goog.provide('i18n.input.chrome.inputview.KeysetView');

goog.require('goog.array');
goog.require('goog.dom.classlist');
goog.require('goog.i18n.bidi');
goog.require('goog.style');
goog.require('goog.ui.Container');
goog.require('i18n.input.chrome.inputview.ConditionName');
goog.require('i18n.input.chrome.inputview.Css');
goog.require('i18n.input.chrome.inputview.SpecNodeName');
goog.require('i18n.input.chrome.inputview.elements.ElementType');
goog.require('i18n.input.chrome.inputview.elements.content.CanvasView');
goog.require('i18n.input.chrome.inputview.elements.content.CharacterKey');
goog.require('i18n.input.chrome.inputview.elements.content.CompactKey');
goog.require('i18n.input.chrome.inputview.elements.content.FunctionalKey');
goog.require('i18n.input.chrome.inputview.elements.content.KeyboardView');
goog.require('i18n.input.chrome.inputview.elements.content.MenuKey');
goog.require('i18n.input.chrome.inputview.elements.content.ModifierKey');
goog.require('i18n.input.chrome.inputview.elements.content.SpaceKey');
goog.require('i18n.input.chrome.inputview.elements.content.SwitcherKey');
goog.require('i18n.input.chrome.inputview.elements.layout.HandwritingLayout');
goog.require('i18n.input.chrome.inputview.elements.layout.LinearLayout');
goog.require('i18n.input.chrome.inputview.elements.layout.SoftKeyView');
goog.require('i18n.input.chrome.inputview.elements.layout.VerticalLayout');
goog.require('i18n.input.chrome.inputview.util');



goog.scope(function() {

var ConditionName = i18n.input.chrome.inputview.ConditionName;
var SpecNodeName = i18n.input.chrome.inputview.SpecNodeName;
var ElementType = i18n.input.chrome.inputview.elements.ElementType;
var content = i18n.input.chrome.inputview.elements.content;
var layout = i18n.input.chrome.inputview.elements.layout;



/**
 * The keyboard.
 *
 * @param {!Object} keyData The data includes soft key definition and key
 *     mapping.
 * @param {!Object} layoutData The layout definition.
 * @param {string} keyboardCode The keyboard code.
 * @param {string} languageCode The language code.
 * @param {!i18n.input.chrome.inputview.Model} model The model.
 * @param {string} name The Input Tool name.
 * @param {!goog.events.EventTarget=} opt_eventTarget .
 * @param {i18n.input.chrome.inputview.Adapter=} opt_adapter .
 * @constructor
 * @extends {goog.ui.Container}
 */
i18n.input.chrome.inputview.KeysetView = function(keyData, layoutData,
    keyboardCode, languageCode, model, name, opt_eventTarget, opt_adapter) {
  goog.base(this);
  this.setParentEventTarget(opt_eventTarget || null);

  /**
   * The key configuration data.
   *
   * @type {!Object}
   * @const
   * @private
   */
  this.keyData_ = keyData;

  /**
   * The layout definition.
   *
   * @type {!Object}
   * @const
   * @private
   */
  this.layoutData_ = layoutData;

  /**
   * The keyboard code.
   *
   * @type {string}
   * @private
   */
  this.keyboardCode_ = keyboardCode;

  /**
   * The language code.
   *
   * @type {string}
   * @private
   */
  this.languageCode_ = languageCode;

  /**
   * The model, the reason use dataModel as its name because model_ will
   * conflict with the one in goog.ui.Container.
   *
   * @type {!i18n.input.chrome.inputview.Model}
   * @private
   */
  this.dataModel_ = model;

  /**
   * The rows in this view, the reason we don't use getChild is that container
   * only accepts control as its child, so we have to use
   * row.render(this.getElement()) style.
   *
   * @type {!Array.<layout.LinearLayout>}
   * @private
   */
  this.rows_ = [];

  /**
   * The maps of all the soft key view.
   *
   * @type {!Object.<string, !layout.SoftKeyView>}
   * @private
   */
  this.softKeyViewMap_ = {};

  /**
   * The map from the condition to the soft key view.
   *
   * @type {!Object.<string, !layout.SoftKeyView>}
   * @private
   */
  this.softKeyConditionMap_ = {};

  /**
   * The on-screen keyboard title.
   *
   * @type {string}
   * @private
   */
  this.title_ = name;

  /**
   * The bus channel to communicate with background.
   *
   * @private {i18n.input.chrome.inputview.Adapter}
   */
  this.adapter_ = opt_adapter || null;

  /**
   * The conditions.
   *
   * @private {!Object.<string, boolean>}
   */
  this.conditions_ = {};
};
goog.inherits(i18n.input.chrome.inputview.KeysetView, goog.ui.Container);
var KeysetView = i18n.input.chrome.inputview.KeysetView;


/**
 * The keyboard.
 *
 * @type {!content.KeyboardView}
 * @private
 */
KeysetView.prototype.keyboardView_;


/**
 * The keyset code from which jumps to this keyset view.
 *
 * @type {string}
 */
KeysetView.prototype.fromKeyset = '';


/**
 * The handwriting canvas view.
 *
 * @type {content.CanvasView}
 * @private
 */
KeysetView.prototype.canvasView_;


/**
 * The space key.
 *
 * @type {!content.SpaceKey}
 * @private
 */
KeysetView.prototype.spaceKey_;


/**
 * The outer height of the view.
 *
 * @type {number}
 * @private
 */
KeysetView.prototype.outerHeight_ = 0;


/**
 * The outer width of the view.
 *
 * @type {number}
 * @private
 */
KeysetView.prototype.outerWidth_ = 0;


/** @override */
KeysetView.prototype.createDom = function() {
  goog.base(this, 'createDom');

  var elem = this.getElement();
  elem.id = this.keyboardCode_.replace(/\./g, '-');
  goog.dom.classlist.add(elem, i18n.input.chrome.inputview.Css.VIEW);
  elem.setAttribute('lang', this.languageCode_);

  var children = this.layoutData_['children'];
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    var layoutElem = /** @type {!layout.LinearLayout} */
        (this.createLayoutElement_(child[i18n.input.chrome.inputview.
            SpecNodeName.SPEC], this));
    // Can't use addChild here, because container only allow control as its
    // child.
    if (layoutElem) {
      layoutElem.render(elem);
      this.rows_.push(layoutElem);
    }
  }

  var softKeyList = [];
  var keySpecs = this.keyData_[SpecNodeName.KEY_LIST];
  var hasAltGrCharacterInTheKeyset = this.hasAltGrCharacterInTheKeyset_(
      keySpecs);
  for (var i = 0; i < keySpecs.length; i++) {
    var softKey = this.createKey_(keySpecs[i][SpecNodeName.SPEC],
        hasAltGrCharacterInTheKeyset);
    if (softKey) {
      softKeyList.push(softKey);
    }
  }
  var mapping = this.keyData_[
      SpecNodeName.MAPPING];
  this.keyboardView_.setUp(softKeyList, this.softKeyViewMap_, mapping);
};


/**
 * Updates the view.
 */
KeysetView.prototype.update = function() {
  this.keyboardView_.update();
};


/**
 * Resizes the view.
 *
 * @param {number} outerWidth The width of the outer space.
 * @param {number} outerHeight The height of the outer space.
 * @param {boolean=} opt_force Forces to resize the view.
 */
KeysetView.prototype.resize = function(outerWidth, outerHeight, opt_force) {
  var needResize = !!opt_force || (this.outerHeight_ != outerHeight ||
      this.outerWidth_ != outerWidth);
  if (this.getElement() && needResize) {
    this.outerHeight_ = outerHeight;
    this.outerWidth_ = outerWidth;
    var elem = this.getElement();
    goog.style.setSize(elem, outerWidth, outerHeight);

    var weightArray = [];
    for (var i = 0; i < this.rows_.length; i++) {
      var row = this.rows_[i];
      weightArray.push(row.getHeightInWeight());
    }

    var splitedHeight = i18n.input.chrome.inputview.util.splitValue(weightArray,
        outerHeight);
    for (var i = 0; i < this.rows_.length; i++) {
      var row = this.rows_[i];
      row.resize(outerWidth, splitedHeight[i]);
    }
  }
};


/**
 * Gets the total height in weight.
 *
 * @return {number} The total height in weight.
 */
KeysetView.prototype.getHeightInWeight = function() {
  var heightInWeight = 0;
  for (var i = 0; i < this.rows_.length; i++) {
    var row = this.rows_[i];
    heightInWeight += row.getHeightInWeight();
  }
  return heightInWeight;
};


/**
 * Apply conditions.
 *
 * @param {!Object.<string, boolean>} conditions The conditions.
 */
KeysetView.prototype.applyConditions = function(conditions) {
  this.conditions_ = conditions;
  for (var condition in conditions) {
    var softKeyView = this.softKeyConditionMap_[condition];
    var isConditionEnabled = conditions[condition];
    if (softKeyView) {
      softKeyView.setVisible(isConditionEnabled);
      var softKeyViewGetWeight = this.softKeyViewMap_[softKeyView.
          giveWeightTo];
      if (softKeyViewGetWeight) {
        // Only supports horizontal weight transfer now.
        softKeyViewGetWeight.dynamicaGrantedWeight += isConditionEnabled ?
            0 : softKeyView.widthInWeight;
      }
    }
  }

  // Adjusts the width of globe key and menu key according to the mock when they
  // both show up.
  // TODO: This is hacky. Remove the hack once figure out a better way.
  if (conditions[ConditionName.SHOW_GLOBE_OR_SYMBOL] &&
      conditions[ConditionName.SHOW_MENU]) {
    var menuKeyView = this.softKeyConditionMap_[ConditionName.SHOW_MENU];
    var globeKeyView =
        this.softKeyConditionMap_[ConditionName.SHOW_GLOBE_OR_SYMBOL];
    if (menuKeyView && globeKeyView) {
      var softKeyViewGetWeight =
          this.softKeyViewMap_[menuKeyView.giveWeightTo];
      if (softKeyViewGetWeight) {
        globeKeyView.widthInWeight -= 0.1;
        menuKeyView.widthInWeight -= 0.4;
        // Shrink a total of 0.5 weight from globe key view and menu key view.
        softKeyViewGetWeight.dynamicaGrantedWeight += 0.5;
      }
    }
  }
};


/**
 * Updates the condition.
 *
 * @param {string} name .
 * @param {boolean} value .
 */
KeysetView.prototype.updateCondition = function(name, value) {
  for (var id in this.softKeyViewMap_) {
    var skv = this.softKeyViewMap_[id];
    skv.dynamicaGrantedWeight = 0;
  }
  this.conditions_[name] = value;
  this.applyConditions(this.conditions_);
  this.resize(this.outerWidth_, this.outerHeight_, true);
  this.update();
};


/**
 * Creates the element according to its type.
 *
 * @param {!Object} spec The specification.
 * @param {!goog.events.EventTarget=} opt_eventTarget The event target.
 * @return {i18n.input.chrome.inputview.elements.Element} The element.
 * @private
 */
KeysetView.prototype.createElement_ = function(spec, opt_eventTarget) {
  var type = spec[SpecNodeName.TYPE];
  var id = spec[SpecNodeName.ID];
  var widthInWeight = spec[
      SpecNodeName.WIDTH_IN_WEIGHT];
  var heightInWeight = spec[
      SpecNodeName.HEIGHT_IN_WEIGHT];
  var width = spec[SpecNodeName.WIDTH];
  var height = spec[SpecNodeName.HEIGHT];
  var padding = spec[SpecNodeName.PADDING];
  var widthPercent = spec[SpecNodeName.WIDTH_PERCENT];
  var heightPercent = spec[SpecNodeName.HEIGHT_PERCENT];
  switch (type) {
    case ElementType.SOFT_KEY_VIEW:
      var condition = spec[SpecNodeName.CONDITION];
      var giveWeightTo = spec[SpecNodeName.GIVE_WEIGHT_TO];
      var softKeyView = new layout.SoftKeyView(id, widthInWeight,
          heightInWeight, condition, giveWeightTo, opt_eventTarget);
      this.softKeyConditionMap_[condition] = softKeyView;
      return softKeyView;
    case ElementType.LINEAR_LAYOUT:
      return new layout.LinearLayout(id, opt_eventTarget);
    case ElementType.VERTICAL_LAYOUT:
      return new layout.VerticalLayout(id, opt_eventTarget);
    case ElementType.LAYOUT_VIEW:
      this.keyboardView_ = new content.KeyboardView(id, opt_eventTarget);
      return this.keyboardView_;
    case ElementType.CANVAS_VIEW:
      this.canvasView_ = new content.CanvasView(id, widthInWeight,
          heightInWeight, opt_eventTarget, this.adapter_);
      return this.canvasView_;
    case ElementType.HANDWRITING_LAYOUT:
      return new layout.HandwritingLayout(id, opt_eventTarget);
  }
  return null;
};


/**
 * Creates the layout element.
 *
 * @param {!Object} spec The specification for the element.
 * @param {!goog.events.EventTarget=} opt_parentEventTarget The parent event
 *     target.
 * @return {i18n.input.chrome.inputview.elements.Element} The element.
 * @private
 */
KeysetView.prototype.createLayoutElement_ = function(spec,
    opt_parentEventTarget) {
  var element = this.createElement_(spec, opt_parentEventTarget);
  if (!element) {
    return null;
  }

  var children = spec[SpecNodeName.CHILDREN];
  if (children) {
    children = goog.array.flatten(children);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var childElem = this.createLayoutElement_(
          child[SpecNodeName.SPEC], element);
      if (childElem) {
        element.addChild(childElem, true);
      }
    }
  }
  if (element.type == ElementType.SOFT_KEY_VIEW) {
    this.softKeyViewMap_[element.id] =
        /** @type {!layout.SoftKeyView} */ (element);
  }
  return element;
};


/**
 * Checks if there is altgr character.
 *
 * @param {!Array.<!Object>} keySpecs The list of key specs.
 * @return {[boolean, boolean]} A list with two boolean values, the first is
 *    for whether there is altgr character of letter keys, the second is for
 *    symbol keys.
 * @private
 */
KeysetView.prototype.hasAltGrCharacterInTheKeyset_ = function(keySpecs) {
  var result = [false, false];
  for (var i = 0; i < keySpecs.length; i++) {
    var spec = keySpecs[i];
    var characters = spec[SpecNodeName.CHARACTERS];
    if (characters && (!!characters[2] || !!characters[3])) {
      var index = i18n.input.chrome.inputview.util.isLetterKey(
          characters) ? 0 : 1;
      result[index] = true;
    }
  }
  return result;
};


/**
 * Creates a soft key.
 *
 * @param {Object} spec The specification.
 * @param {!Array.<boolean, boolean>} hasAltGrCharacterInTheKeyset The list
 *     of results for whether there is altgr character, the first for letter
 *     key, the second for symbol key.
 * @return {i18n.input.chrome.inputview.elements.content.SoftKey} The soft key.
 * @private
 */
KeysetView.prototype.createKey_ = function(spec, hasAltGrCharacterInTheKeyset) {
  var type = spec[SpecNodeName.TYPE];
  var id = spec[SpecNodeName.ID];
  var keyCode = spec[SpecNodeName.KEY_CODE]; // Could be undefined.
  var name = spec[SpecNodeName.NAME];
  var characters = spec[SpecNodeName.CHARACTERS];
  var iconCssClass = spec[SpecNodeName.ICON_CSS_CLASS];
  var textCssClass = spec[SpecNodeName.TEXT_CSS_CLASS];
  var toKeyset = spec[SpecNodeName.TO_KEYSET];
  var toKeysetName = spec[SpecNodeName.
      TO_KEYSET_NAME];
  switch (type) {
    case ElementType.MODIFIER_KEY:
      var toState = spec[SpecNodeName.TO_STATE];
      var supportSticky = spec[SpecNodeName.SUPPORT_STICKY];
      return new content.ModifierKey(id, name, iconCssClass, toState,
          this.dataModel_.stateManager, supportSticky);
    case ElementType.SPACE_KEY:
      this.spaceKey_ = new content.SpaceKey(id, this.dataModel_.stateManager,
          this.title_, characters, undefined, iconCssClass);
      return this.spaceKey_;
    case ElementType.BACKSPACE_KEY:
    case ElementType.ENTER_KEY:
    case ElementType.TAB_KEY:
    case ElementType.ARROW_UP:
    case ElementType.ARROW_DOWN:
    case ElementType.ARROW_LEFT:
    case ElementType.ARROW_RIGHT:
    case ElementType.HIDE_KEYBOARD_KEY:
    case ElementType.GLOBE_KEY:
      return new content.FunctionalKey(id, type, name, iconCssClass);
    case ElementType.IME_SWITCH:
      return new content.FunctionalKey(id, type, name, iconCssClass, undefined,
          textCssClass);
    case ElementType.MENU_KEY:
      return new content.MenuKey(id, type, name, iconCssClass, toKeyset);
    case ElementType.SWITCHER_KEY:
      var record = spec[SpecNodeName.RECORD];
      return new content.SwitcherKey(id, type, name, iconCssClass, toKeyset,
          toKeysetName, record);
    case ElementType.COMPACT_KEY:
      var hintText = spec[SpecNodeName.HINT_TEXT];
      var text = spec[SpecNodeName.TEXT];
      var marginLeftPercent = spec[SpecNodeName.MARGIN_LEFT_PERCENT];
      var marginRightPercent = spec[SpecNodeName.MARGIN_RIGHT_PERCENT];
      var isGrey = spec[SpecNodeName.IS_GREY];
      var moreKeys = spec[SpecNodeName.MORE_KEYS];
      return new content.CompactKey(
          id, text, hintText, this.dataModel_.stateManager, marginLeftPercent,
          marginRightPercent, isGrey, moreKeys);
    case ElementType.CHARACTER_KEY:
      var isLetterKey = i18n.input.chrome.inputview.util.isLetterKey(
          characters);
      return new content.CharacterKey(id, keyCode || 0,
          characters, isLetterKey, hasAltGrCharacterInTheKeyset[isLetterKey],
          this.dataModel_.settings.alwaysRenderAltGrCharacter,
          this.dataModel_.stateManager,
          goog.i18n.bidi.isRtlLanguage(this.languageCode_));
  }
  return null;
};


/**
 * Gets the view for the key.
 *
 * @param {string} code The code of the key.
 * @return {i18n.input.chrome.inputview.elements.content.SoftKey} The soft key.
 */
KeysetView.prototype.getViewForKey = function(code) {
  return this.keyboardView_.getViewForKey(code);
};


/**
 * True to set the title visible.
 *
 * @param {boolean} visible True to set title visible.
 */
KeysetView.prototype.setTitleVisible = function(visible) {
  if (this.spaceKey_) {
    this.spaceKey_.setTitleVisible(visible);
  }
};


/**
 * Gets the width in weight for a entire row.
 *
 * @return {number} .
 */
KeysetView.prototype.getWidthInWeight = function() {
  if (this.rows_.length > 0) {
    return this.rows_[0].getWidthInWeight();
  }

  return 0;
};


/**
 * Whether there are strokes on canvas.
 *
 * @return {boolean} Whether there are strokes on canvas.
 */
KeysetView.prototype.hasStrokesOnCanvas = function() {
  if (this.canvasView_) {
    return this.canvasView_.hasStrokesOnCanvas();
  } else {
    return false;
  }
};


/**
 * Cleans the stokes.
 */
KeysetView.prototype.cleanStroke = function() {
  if (this.canvasView_) {
    this.canvasView_.reset();
  }
};


/**
 * Checks the view whether is handwriting panel.
 *
 * @return {boolean} Whether is handwriting panel.
 */
KeysetView.prototype.isHandwriting = function() {
  return this.keyboardCode_ == 'hwt';
};
});  // goog.scope
