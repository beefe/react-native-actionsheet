import React, { Component, PropTypes } from 'react'
import {
	Text, View, StyleSheet, Dimensions,
	Modal, TouchableHighlight, Animated, ScrollView
} from 'react-native'

import styles, { btnStyle, sheetStyle, hairlineWidth } from './styles'


const TITLE_H 				= 40
const CANCEL_MARGIN  	= 6
const BUTTON_H 				= 50 + hairlineWidth
const WARN_COLOR 			= '#ff3b30'
const MAX_HEIGHT 			= Dimensions.get('window').height * 0.7


class ActionSheet extends Component {
	constructor(props) {
		super(props)
		this.scrollEnabled = false
		this.translateY = this._calculateHeight(props)
		this.state = {
			visible: false,
			sheetAnim: new Animated.Value(this.translateY)
		}
		this._cancel = this._cancel.bind(this)
	}

	componentWillReceiveProps(nextProps) {
		this.translateY = this._calculateHeight(nextProps)
	}

	show() {
		this.setState({visible: true})
		this._showSheet();
	}

	hide(index) {
		this._hideSheet(() => {
			this.setState({visible: false})
			this.props.onPress(index)
		})
	}

	_cancel() {
		const { cancelButtonIndex } = this.props
		// 保持和 ActionSheetIOS 一致，
		// 未设置 cancelButtonIndex 时，点击背景不隐藏 ActionSheet
		if (cancelButtonIndex > -1) {
			this.hide(cancelButtonIndex)
		}
	}

	_showSheet() {
		Animated.timing(this.state.sheetAnim, {
			toValue: 0,
			duration: 250
		}).start()
	}

	_hideSheet(callback) {
		Animated.timing(this.state.sheetAnim, {
			toValue: this.translateY,
			duration: 150
		}).start(callback || function() {})
	}

	_calculateHeight(props) {
		let count = props.options.length
		let height = BUTTON_H * count + CANCEL_MARGIN
		if (props.title) height += TITLE_H
		if (height > MAX_HEIGHT) {
			this.scrollEnabled = true;
			return MAX_HEIGHT
		} else {
			this.scrollEnabled = false;
			return height
		}
	}

	_renderTitle() {
		const {title, accessible, accessibilityLabel, testID} = this.props.title

		if (!title) {
			return null
		}

		if (React.isValidElement(title)) {
			return (
				<View style={sheetStyle.title}>{title}</View>
			)
		}

		return (
			<View style={sheetStyle.title}>
				<Text style={sheetStyle.titleText} accessible={accessible} accessibilityLabel={accessibilityLabel} testID={testID}>{title}</Text>
			</View>
		)
	}

	_renderCancelButton() {
		let {options, cancelButtonIndex, tintColor, accessible, accessibilityLabel, testID} = this.props
		if (cancelButtonIndex > -1 && options[cancelButtonIndex]) {
			return (
				<TouchableHighlight
					activeOpacity={1}
					underlayColor="#f4f4f4"
					style={[btnStyle.wrapper, {marginTop: 6}]}
					onPress={this._cancel}
					accessible={accessible}
					accessibilityLabel={accessibilityLabel + 'Cancel'}
					testID={testID + 'Cancel'}
				>
					<Text style={[btnStyle.title, {fontWeight: '700', color: tintColor}]}>{options[cancelButtonIndex]}</Text>
				</TouchableHighlight>
			)
		} else {
			return null
		}
	}

	_createButton(title, fontColor, index, style, accessible, accessibilityLabel, testID) {
		let titleNode = null
		if (React.isValidElement(title)) {
			titleNode = title
		} else {
			titleNode = <Text style={[btnStyle.title, {color: fontColor}]}>{title}</Text>
		}
		return (
			<TouchableHighlight
				key={index}
				activeOpacity={1}
				underlayColor="#f4f4f4"
				style={[btnStyle.wrapper, style || {}]}
				onPress={this.hide.bind(this, index)}
				accessible={accessible}
				accessibilityLabel={accessibilityLabel + 'Option' + index}
				testID={testID + 'Option' + index}
			>
				{titleNode}
			</TouchableHighlight>
		)
	}

	_renderOptions() {
		let {options, tintColor, cancelButtonIndex, destructiveButtonIndex, accessible, accessibilityLabel, testID} = this.props
		return options.map((title, index) => {
			let fontColor = destructiveButtonIndex === index ? WARN_COLOR : tintColor
			return index === cancelButtonIndex ? null : this._createButton(title, fontColor, index, accessible, accessibilityLabel, testID)
		})
	}

	render() {
		const { cancelButtonIndex } = this.props
		const { visible, sheetAnim } = this.state
		return (
			<Modal
				visible={visible}
				transparent={true}
				animationType="none"
				onRequestClose={this._cancel}
			>
				<View style={sheetStyle.wrapper}>
					<Text style={styles.overlay} onPress={this._cancel}></Text>
					<Animated.View
						style={[sheetStyle.bd, {height: this.translateY, transform: [{translateY: sheetAnim}]}]}
					>
						{this._renderTitle()}
						<ScrollView
							scrollEnabled={this.scrollEnabled}
							contentContainerStyle={sheetStyle.options}>
							{this._renderOptions()}
						</ScrollView>
						{this._renderCancelButton()}
					</Animated.View>
				</View>
			</Modal>
		)
	}
}


ActionSheet.propTypes = {
	title: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.element
	]),
	options: PropTypes.arrayOf((propVal, key, componentName, location, propFullName) => {
		if (typeof propVal[key] !== 'string' && !React.isValidElement(propVal[key])) {
			return new Error(
        'Invalid prop `' + propFullName + '` supplied to' +
        ' `' + componentName + '`. Validation failed.'
      )
		}
	}),
	tintColor: PropTypes.string,
	cancelButtonIndex: PropTypes.number,
	destructiveButtonIndex: PropTypes.number,
	onPress: PropTypes.func
}


ActionSheet.defaultProps = {
	tintColor: '#007aff',
	onPress: () => {}
}


export default ActionSheet
