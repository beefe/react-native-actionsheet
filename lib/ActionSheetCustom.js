import React from 'react'
import { Text, View, Dimensions, Modal, TouchableHighlight, Animated, ScrollView, Easing } from 'react-native'
import * as utils from './utils'
import styles2 from './styles'

const WARN_COLOR = '#FF3B30'
const MAX_HEIGHT = Dimensions.get('window').height * 0.7

class ActionSheet extends React.Component {
  static defaultProps = {
    tintColor: '#007AFF',
    buttonUnderlayColor: '#F4F4F4',
    onPress: () => {},
    styles: {}
  }

  static getDerivedStateFromProps(props, state) {
    let translateY = calculateHeight(props)
    let scrollEnabled = translateY > MAX_HEIGHT
    if (scrollEnabled) {
      translateY = MAX_HEIGHT
    }

    if (state.translateY !== translateY) {
      return { scrollEnabled, translateY };
    }
    return null;
  }

  constructor (props) {
    super(props)
    let translateY = calculateHeight(props)
    let scrollEnabled = translateY > MAX_HEIGHT
    if (scrollEnabled) {
      translateY = MAX_HEIGHT
    }

    this.state = {
      scrollEnabled,
      translateY,
      visible: false,
      sheetAnim: new Animated.Value(translateY)
    }
  }

  show = () => {
    this.setState({visible: true}, () => {
      this._showSheet()
    })
  }

  hide = (index) => {
    this._hideSheet(() => {
      this.setState({visible: false}, () => {
        this.props.onPress(index)
      })
    })
  }

  _cancel = () => {
    const { cancelButtonIndex } = this.props
    // 保持和 ActionSheetIOS 一致，
    // 未设置 cancelButtonIndex 时，点击背景不隐藏 ActionSheet
    if (utils.isset(cancelButtonIndex)) {
      this.hide(cancelButtonIndex)
    }
  }

  _showSheet = () => {
    Animated.timing(this.state.sheetAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease)
    }).start()
  }

  _hideSheet (callback) {
    Animated.timing(this.state.sheetAnim, {
      toValue: this.state.translateY,
      duration: 200
    }).start(callback)
  }

  _renderTitle () {
    const { title, styles } = this.props
    const mergedStyles = getMergedStyles(styles)
    if (!title) return null
    return (
      <View style={mergedStyles.titleBox}>
        {React.isValidElement(title) ? title : (
          <Text style={mergedStyles.titleText}>{title}</Text>
        )}
      </View>
    )
  }

  _renderMessage () {
    const { message, styles } = this.props
    const mergedStyles = getMergedStyles(styles)
    if (!message) return null
    return (
      <View style={mergedStyles.messageBox}>
        {React.isValidElement(message) ? message : (
          <Text style={mergedStyles.messageText}>{message}</Text>
        )}
      </View>
    )
  }

  _renderCancelButton () {
    const { options, cancelButtonIndex } = this.props
    if (!utils.isset(cancelButtonIndex)) return null
    return this._createButton(options[cancelButtonIndex], cancelButtonIndex)
  }

  _createButton (title, index) {
    const styles = getMergedStyles(this.props.styles)
    const { buttonUnderlayColor, cancelButtonIndex, destructiveButtonIndex, tintColor } = this.props
    const fontColor = destructiveButtonIndex === index ? WARN_COLOR : tintColor
    const buttonBoxStyle = cancelButtonIndex === index ? styles.cancelButtonBox : styles.buttonBox
    return (
      <TouchableHighlight
        key={index}
        activeOpacity={1}
        underlayColor={buttonUnderlayColor}
        style={buttonBoxStyle}
        onPress={() => this.hide(index)}
      >
        {React.isValidElement(title) ? title : (
          <Text style={[styles.buttonText, {color: fontColor}]}>{title}</Text>
        )}
      </TouchableHighlight>
    )
  }

  _renderOptions () {
    const { cancelButtonIndex } = this.props
    return this.props.options.map((title, index) => {
      return cancelButtonIndex === index ? null : this._createButton(title, index)
    })
  }

  render () {
    const styles = getMergedStyles(this.props.styles)
    const { visible, sheetAnim, scrollEnabled, translateY } = this.state
    return (
      <Modal visible={visible}
        animationType='none'
        transparent
        onRequestClose={this._cancel}
      >
        <View style={[styles.wrapper]}>
          <Text
            style={[styles.overlay]}
            onPress={this._cancel}
          />
          <Animated.View
            style={[
              styles.body,
              { height: translateY, transform: [{ translateY: sheetAnim }] }
            ]}
          >
            {this._renderTitle()}
            {this._renderMessage()}
            <ScrollView scrollEnabled={scrollEnabled}>{this._renderOptions()}</ScrollView>
            {this._renderCancelButton()}
          </Animated.View>
        </View>
      </Modal>
    )
  }
}

/**
 * elements: titleBox, messageBox, buttonBox, cancelButtonBox
 * box size: height, marginTop, marginBottom
 */
function calculateHeight(props) {
  const styles = getMergedStyles(props.styles)

  const getHeight = (name) => {
    const style = styles[name][styles[name].length - 1]
    let h = 0
    ;['height', 'marginTop', 'marginBottom'].forEach((attrName) => {
      if (typeof style[attrName] !== 'undefined') {
        h += style[attrName]
      }
    })
    return h
  }

  let height = 0
  if (props.title) height += getHeight('titleBox')
  if (props.message) height += getHeight('messageBox')
  if (utils.isset(props.cancelButtonIndex)) {
    height += getHeight('cancelButtonBox')
    height += (props.options.length - 1) * getHeight('buttonBox')
  } else {
    height += props.options.length * getHeight('buttonBox')
  }

  return height
}

function getMergedStyles(styles) {
  const obj = {}
  Object.keys(styles2).forEach((key) => {
    const arr = [styles2[key]]
    if (styles[key]) {
      arr.push(styles[key])
    }
    obj[key] = arr
  })
  return obj
}

export default ActionSheet
