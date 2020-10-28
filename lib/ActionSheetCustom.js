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

  constructor (props) {
    super(props)
    this.scrollEnabled = false
    this.translateY = this._calculateHeight(props)
    this.state = {
      visible: false,
      sheetAnim: new Animated.Value(this.translateY)
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    this.translateY = this._calculateHeight(nextProps)
  }

  get styles () {
    const { styles } = this.props
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
      toValue: this.translateY,
      duration: 200
    }).start(callback)
  }

  /**
   * elements: titleBox, messageBox, buttonBox, cancelButtonBox
   * box size: height, marginTop, marginBottom
   */
  _calculateHeight (props) {
    const styles = this.styles

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

    if (height > MAX_HEIGHT) {
      this.scrollEnabled = true
      height = MAX_HEIGHT
    } else {
      this.scrollEnabled = false
    }

    return height
  }

  _renderTitle () {
    const { title } = this.props
    const styles = this.styles
    if (!title) return null
    return (
      <View style={styles.titleBox}>
        {React.isValidElement(title) ? title : (
          <Text style={styles.titleText}>{title}</Text>
        )}
      </View>
    )
  }

  _renderMessage () {
    const { message } = this.props
    const styles = this.styles
    if (!message) return null
    return (
      <View style={styles.messageBox}>
        {React.isValidElement(message) ? message : (
          <Text style={styles.messageText}>{message}</Text>
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
    const styles = this.styles
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
    const styles = this.styles
    const { visible, sheetAnim } = this.state
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
              { height: this.translateY, transform: [{ translateY: sheetAnim }] }
            ]}
          >
            {this._renderTitle()}
            {this._renderMessage()}
            <ScrollView scrollEnabled={this.scrollEnabled}>{this._renderOptions()}</ScrollView>
            {this._renderCancelButton()}
          </Animated.View>
        </View>
      </Modal>
    )
  }
}

export default ActionSheet
