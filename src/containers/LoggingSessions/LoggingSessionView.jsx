import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { SafeAreaView, ScrollView, Linking, View, Text, ImageBackground, Dimensions } from 'react-native'

import { connect } from 'react-redux'
import { DateTime } from 'luxon'
import RNFS from 'react-native-fs'
import { Dialog } from '@rneui/themed'
import Share from 'react-native-share'
import RNFetchBlob from "rn-fetch-blob"

import { getLoggingSession, fetchLoggingSessionSamples, clearLoggingSession, deleteLoggingSession, updateLoggingSessionComment } from '../../actions/LoggingActions'
import ActionsMenu from '../../components/LoggingSessions/ActionsMenu'
import DataAverages from '../../components/LoggingSessions/DataAverages'
import SessionLineChart from '../../components/LoggingSessions/SessionLineChart'
import LoggingSessionCommentDialog from '../../components/LoggingSessions/LoggingSessionCommentDialog'
import WaitingDialog from '../../components/LoggingSessions/WaitingDialog'
import Comment from '../../components/LoggingSessions/Comment'


const DeleteSessionDialog = ({visible,deleteSessionHandler}) => {

  if (!visible) return null

  return  <Dialog>
    <View style={{ display: 'flex', alignItems: 'center' }}>
      <Text >
        Are you sure you want to delete this session?
      </Text>
    </View>
    <Dialog.Button
      title="Cancel"
      buttonStyle={{ marginTop: 20 }}
      onPress={() => { deleteSessionHandler.call(this,'cancel') }}
    />
    <Dialog.Button
      title="Delete"
      buttonStyle={{ marginTop: 20 }}
      onPress={() => { deleteSessionHandler.call(this,'confirm') }}
    />
  </Dialog>

}

class LoggingSessionView extends Component {

  constructor(props) {
    super(props)
    const { route }  = props
    const { params } = route
    const { loggingSessionId } = params
    this.state = {
      loggingSessionId,
      dataSamples: [],
      turbidityEnabled: true,
      temperatureEnabled: false,
      images: [],
      comment: '',
      commentBackup: '',
      commentDialogVisible: false,
      deleteSessionDialogVisible: false,
      waitingDialogVisible: false,
      waitingDialogText: '',
    }
  }

  componentDidMount() {
    this.setState({
      waitingDialogVisible: true,
      waitingDialogText: "Loading...",
    })
    const { route, dispatch }  =  this.props
    const { params } = route
    const { loggingSessionId } = params
    dispatch(getLoggingSession(loggingSessionId))
    dispatch(fetchLoggingSessionSamples(loggingSessionId))
    this.updateImages(loggingSessionId)
      .catch((e) => {
        console.log(`XXX failed to run this.updateImages(${loggingSessionId})`,e)
      })
  }

  componentDidUpdate(prevProps,prevState) {
    const updateHash = {}
    if (this.state.waitingDialogVisible && this.props.logging.loggingSessionSamplesLoaded) {
      updateHash['waitingDialogVisible'] = false
      updateHash['waitingDialogText'] = ''
    }
    const { loggingSession } = this.props.logging
    if (!this.state.commentDialogVisible && loggingSession && loggingSession.comment && this.state.comment!==loggingSession.comment) {
      updateHash['comment'] = loggingSession.comment
    }
    if (Object.keys(updateHash).length) {
      this.setState(updateHash)
    }
  }

  componentWillUnmount() {
    const { dispatch }  =  this.props
    dispatch(clearLoggingSession())
  }

  renderActionsMenu = (logging) => {
    const { loggingSession } = logging
    if (!loggingSession) return null
    const { id }  = loggingSession
    return <ActionsMenu
      loggingSessionId={id}
      exportDataHandler={this.exportData}
      deleteSessionHandler={this.deleteSession}
    />
  }

  getAttachments =  async () => {

    const { loggingSession, loggingSessionSamples } = this.props.logging
    const { timezoneName, timezoneOffset, comment } = loggingSession
    const csvArray = [
      ['Date','Time','Lat','Lon','Turbidity','Temperature',,'Comment'],
      [timezoneName || 'UTC','','','','NTU','°C']
    ]
    const commentRows = (comment || '').split('\n')
    commentIterator = 0
    loggingSessionSamples.forEach((item) => {
      const timestamp = Math.round(item.timestamp/1000)*1000 + (timezoneOffset * 60 * 60 * 1000)
      const dateTimeOptions = { zone: `UTC${timezoneOffset}` }
      const dateTime = DateTime.fromMillis(timestamp,dateTimeOptions)
      const dateStr = dateTime.toFormat("dd LLL yyyy")
      const timeStr = dateTime.toFormat("HH:mm:ss")
      csvArray.push([
        dateStr,
        timeStr,
        item.locationLat,
        item.locationLng,
        item.turbidityValue,
        item.temperatureValue,
        ,
        commentRows[commentIterator],
      ].join(','))
      commentIterator++
    })
    const csvStr = csvArray.join("\r\n")
    const { loggingSessionId } = this.state
    const dirName = `${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}/csv`
    RNFS.mkdir(dirName)
      .then((r) => {
        console.log("XXX dir created",dirName)
      })
      .catch( error => {
        console.log("XXX error RNFS.mkdir",error)
      })
    const imageFiles = await RNFS.readDir(`${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}/images`)
      .catch(e => {
        console.log("XXX RNFS.readDir error 1",e)
        return []
      })

    const mapFiles = await RNFS.readDir(`${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}/mapimage`)
      .catch(e => {
        console.log("XXX RNFS.readDir error 2",e)
        return []
      })

    const attachments = []

    imageFiles.forEach((fileItem) => {
      attachments.push({
        path: fileItem.path,
        type: 'jpg',
      })
    })

    mapFiles.forEach((fileItem) => {
      attachments.push({
        path: fileItem.path,
        type: 'jpg',
      })
    })

    const timestamp = loggingSession.timestamp
    const dateTime = DateTime.fromMillis(timestamp)

    const filePath = `${dirName}/NEP-Link-data-${dateTime.toFormat("dd-LLL-yyyy-HHmmss")}.csv`

    const csvFile = await RNFS.writeFile(filePath, csvStr, "utf8")
      .then(() => {
        // console.log("XXX file written",filePath)
        // console.log("XXX attachments",attachments)
        return {
          path: filePath,
          type: 'csv',
        }
      })
      .catch( error => {
        console.log("XXX error RNFS.writeFile",error)
      })

    attachments.push(csvFile)

    return attachments

  }

  exportData = async () => {

    this.setState({
      waitingDialogVisible: true,
      waitingDialogText: 'Preparing...',
    })

    const { loggingSession } = this.props.logging
    const timestamp = loggingSession.timestamp
    const dateTime = DateTime.fromMillis(timestamp)

    const attachments = await this.getAttachments()
    const attachmentUrlsArray = []
    const attachmentFilenamesArray = []

    for (const attachment of attachments) {

      const filePath = attachment.path
      if (!filePath) return true
      const pathSplit = filePath.split("/")
      const fileName = pathSplit[pathSplit.length-1]
      attachmentFilenamesArray.push(fileName)

      const data = await RNFetchBlob.fs.readFile(filePath, 'base64')
      const base64Data = `data:${attachment.type};base64,${data}`

      attachmentUrlsArray.push(base64Data)

    }

    const mailSubject = `NEP-LINK Files for logging session at ${dateTime.toFormat("dd-LLL-yyyy HH:mm:ss")}`
    const mailBody = `Hello, Here are your files for the NEP-LINK logging session conducted at ${dateTime.toFormat("dd-LLL-yyyy HH:mm:ss")}.`

    Share.open({
      title: mailSubject,
      subject: mailSubject,
      message: mailBody,
      urls: attachmentUrlsArray,
      filenames: attachmentFilenamesArray,
    })

  }

  deleteSession = (action='showConfirmationDialog') => {
    if (action==='showConfirmationDialog') {
      return this.setState({ deleteSessionDialogVisible: true })
    } else if (action==='cancel') {
      return this.setState({ deleteSessionDialogVisible: false })
    }
    this.props.navigation.goBack()
    const { loggingSession } = this.props.logging
    this.props.dispatch(deleteLoggingSession(loggingSession.id))
  }

  commentDialogOnChangeText = (value) => {
    this.setState({ comment: value })
  }

  commentDialogCancelButtonOnPress = () => {
    this.setState({
      comment: this.state.commentBackup,
      commentDialogVisible: false
     })
  }

  commentDialogOkButtonOnPress = () => {
    this.setState({
      commentDialogVisible: false
     })
    const { loggingSession } = this.props.logging
    this.props.dispatch(updateLoggingSessionComment(loggingSession.id,this.state.comment))
  }

  commentIconOnPress = () => {
    this.setState({
      commentBackup: this.state.comment,
      commentDialogVisible: true
     })
  }

  renderSessionLineChart = (logging) => {
    const { loggingSessionSamples } = logging
    if (!loggingSessionSamples || !loggingSessionSamples.length) return null
    const turbidityDataSamples = loggingSessionSamples.map(({ timestamp, turbidityValue }) => [timestamp,turbidityValue] )
    const turbiditySamples = turbidityDataSamples.map( (ds) => {
      const timestamp = ds[0]
      const value = ds[1]
      const label = DateTime.fromMillis(parseInt(ds[0])).toFormat("ss")
      return { timestamp, value, label }
    })
    return <SessionLineChart
      turbiditySamples={turbiditySamples}
    />
  }

  renderDataAverages = (logging) => {
    const { loggingSessionSamples, loggingSession } = logging
    if (!loggingSessionSamples || !loggingSessionSamples.length || !loggingSession) return null
    const { turbidityEnabled } = loggingSession
    console.log("XXX turbidityEnabled",turbidityEnabled)
    const turbidityValues = loggingSessionSamples.map(({ turbidityValue }) => turbidityValue )
    const turbiditySum = turbidityValues.reduce((sum, x) => sum + x)
    const turbidityAverage = parseFloat((turbiditySum/turbidityValues.length).toFixed(2))
    return <DataAverages
      turbidityEnabled={turbidityEnabled}
      turbidityAverage={turbidityAverage}
    />
  }

  updateImages = async (loggingSessionId) => {

    const fileDirsRootPath = `${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}`

    const mapFilesDirName = `${fileDirsRootPath}/mapimage`
    const mapFiles = await RNFS.readDir(mapFilesDirName)
      .catch(e => {
        console.log("XXX RNFS.readDir error 3",e)
        RNFS.mkdir(mapFilesDirName)
        return []
      })

    const imageFilesDirName = `${fileDirsRootPath}/images`
    const imageFiles = await RNFS.readDir(imageFilesDirName)
      .catch(e => {
        console.log("XXX RNFS.readDir error 4",e)
        RNFS.mkdir(imageFilesDirName)
        return []
      })

    const imagesArray = []
    mapFiles.forEach((file) => {
      imagesArray.push({
        imageType: 'map',
        path: file.path
      })
    })

    imageFiles.forEach((file) => {
      imagesArray.push({
        imageType: 'photo',
        path: file.path
      })
    })

    this.setState({ images: imagesArray })

  }

  renderImages = () => {

    if (!this.state.images.length) return null

    return <View style={{ width: Dimensions.get('screen').width, display: 'flex', flexDirection: 'row' }}>
      {this.state.images.map((image,index) => <ImageBackground
          source={{uri: `file:\/\/${image.path}` }}
          key={index.toString()}
          resizeMode="cover"
          style={{
            flex: 1,
            justifyContent: 'center',
            height: 120,
            width: 120,
            margin: 20,
          }}
        />
      )}
    </View>

  }

  renderComment = (logging) => {

    const { loggingSession } = logging
    if (!loggingSession) return null

    return <Comment
      comment={this.state.comment}
      commentEditOnPressHandler={this.commentIconOnPress}
    />

  }

  renderBody = (props,state) => {
    return <SafeAreaView>
      {state.waitingDialogVisible && <WaitingDialog
        text={this.state.waitingDialogText}
      />}
      <DeleteSessionDialog
        visible={state.deleteSessionDialogVisible}
        deleteSessionHandler={this.deleteSession}
      />
      {state.commentDialogVisible && <LoggingSessionCommentDialog
        commentValue={this.state.comment}
        commentOnChangeTextHandler={this.commentDialogOnChangeText}
        cancelButtonHandler={this.commentDialogCancelButtonOnPress}
        okButtonHandler={this.commentDialogOkButtonOnPress}
      />}
      <ScrollView>
        <>{this.renderActionsMenu(props.logging)}</>
        <>{this.renderDataAverages(props.logging)}</>
        <>{this.renderSessionLineChart(props.logging)}</>
        <>{this.renderComment(props.logging)}</>
        <>{this.renderImages()}</>
      </ScrollView>
    </SafeAreaView>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default connect(({ devices, logging }) => ({ devices, logging }))(LoggingSessionView)
