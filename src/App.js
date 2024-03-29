import React from 'react'
import { View, Panel, PanelHeader, Button, Div, Textarea, FormLayout, Select } from '@vkontakte/vkui'
import '@vkontakte/vkui/dist/vkui.css'
import Icon24Repeat from '@vkontakte/icons/dist/24/repeat'
import { languages, checkLanguageAvailability } from './languages'
import connect from '@vkontakte/vkui-connect'
import ReactGA from 'react-ga'
import banner from './banner.png'
import { getObjectUrl } from './utils'

const apiKey = '5ad374573f56fbca9889cd71b0536db3';
const accountId = '1086';

const widthPercent = '45%';

const styles = {
	externalLink: {
		display : 'block',
		textAlign : 'center',
		backgroundColor : '#3075f3',
		marginTop : '-1px'
	},
	banner: {
		width : 320,
		height : 100
	},
	selectWrapper: {
		textAlign : 'center',
		display : 'flex',
		flexDirection : 'row',
		justifyContent : 'center',
		alignItems : 'center'
	},
	select: {
		flexGrow  : 2,
		width : widthPercent
	},
	reverseButton: {
		display : 'inline-block',
		margin : '0 5px',
		color : 'var(--button_primary_background)'
	}
};

const getColor = () => window.document.body.getAttribute('scheme') === 'client_light' ? '#4a4a4a' : '#fff';

class App extends React.Component {

	state = {
		activePanel: 'home',
		text : '',
		translateText : '',
		langFrom : 'en',
		langTo : 'ru',
		error : false,
		fetchedUser : null
	}

	componentDidMount() {
		connect.subscribe((e) => {
			switch (e.detail.type) {
				case 'VKWebAppGetUserInfoResult':
					ReactGA.initialize('UA-83599084-6', {
						gaOptions: {
							userId: e.detail.data.id
						}
					});
					this.setState({ fetchedUser: e.detail.data })
					break
				case 'VKWebAppGetUserInfoFailed':
					ReactGA.initialize('UA-83599084-6')
					break
				case 'VKWebAppUpdateConfig':
					if (typeof e.detail.data.scheme !== 'undefined')
						window.document.body.setAttribute('scheme', e.detail.data.scheme)
					break
				default:
					console.log(e.detail.type)
			}
		})
		connect.send('VKWebAppGetUserInfo', {})
		connect.send("VKWebAppUpdateConfig", {})

		const object = getObjectUrl()
		if (object !== null) {
			if (typeof object.text !== 'undefined') {
				let text = object.text
				this.setState({ text })
			}
		}
	}

	onChangeText = (e) => {
		const text = e.target.value
		this.setState({ text })
	}

	onClickTranslateButton = () => {
		const text = this.state.text.trim()

		ReactGA.event({
			category: 'Translate',
			action: 'onClickTranslateButton',
			value : JSON.stringify(this.state)
		})

		if (text !== '') {
			let { langTo } = this.state

			fetch(`https://api.multillect.com/translate/json/1.0/${accountId}?method=translate/api/translate&to=${langTo}&text=${text}&sig=${apiKey}`)
			.then(res => res.json())
			.then(data => {
				if (typeof data.result.language !== 'undefined' && data.result.language.code !== null) {
					const code = data.result.language.code
					if (this.state.langFrom !== code) {
						if (checkLanguageAvailability(code)) {
							this.setState({ langFrom : code })
						}
					}
				}
				this.setState({ translateText : data.result.translated })
			})
			.catch(e => {
				this.setState({ translateText : '' , error : true })
			})
		} else {
			this.setState({ translateText : '' })
		}
	}

	onReverseLanguage = () => {

		ReactGA.event({
			category: 'Translate',
			action: 'onReverseLanguage'
		})

		this.setState({
			langFrom : this.state.langTo,
			langTo : this.state.langFrom
		})
	}

	renderSelect = type => (
		<Select style={styles.select}
		        value={this.state[type]}
		        onChange={(e) => this.setState({ [type] : e.target.value })}>
			{ languages.map((lang,index) => (
				<option key={index} value={lang.value}>{lang.text}</option>
			))}
		</Select>
	)

	render() {
		return (
			<View activePanel={this.state.activePanel}>
				<Panel id='home' theme='white'>
					<PanelHeader>
						Переводчик
					</PanelHeader>
					<a
						style={styles.externalLink}
						href='https://skyeng.ru/go/translate_vk'
						target='_blank'
						rel='noopener noreferrer'
					>
						<img
							style={styles.banner}
							src={banner}
							alt=''
						/>
					</a>
					<Div style={styles.selectWrapper}>
						{this.renderSelect('langFrom')}
						<div
						onClick={() => this.onReverseLanguage()}
						style={styles.reverseButton}>
							<Icon24Repeat />
						</div>
						{this.renderSelect('langTo')}
					</Div>
					<FormLayout>
						<Textarea
							top="Введите текст (макс: 300 символов)"
							placeholder="Введите текст, который хотите перевести"
							value={this.state.text}
							onChange={this.onChangeText}
							maxLength={300}
						>
						</Textarea>
						<Button
							size='xl'
							onClick={() => this.onClickTranslateButton()}
						>
							Перевести
						</Button>
						{
							this.state.translateText !== '' &&
							<div>
							<Div
								style={{
									color : getColor()
								}}
							>
									Перевод:
									<p>{this.state.translateText}</p>
							</Div>
							</div>
						}

						{
							this.state.error &&
							<Div
								style={{
									color : getColor()
								}}
							>
								<p>Извините, но возникла какая-то ошибка. Попробуйте повторить через 2-3 минуты.</p>
							</Div>
						}
					</FormLayout>
				</Panel>
			</View>
		)
	}
}

export default App
