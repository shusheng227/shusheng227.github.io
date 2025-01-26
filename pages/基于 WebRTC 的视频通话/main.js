const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

localVideo.addEventListener('loadedmetadata', function() {
  console.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});
remoteVideo.addEventListener('loadedmetadata', function() {
  console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

let localStream;
let pc;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

async function start() {
  console.log('start');
  startButton.disabled = true;
  localVideo.play();
  localStream = localVideo.captureStream();
  callButton.disabled = false;
}

async function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log('Starting call');
  startTime = window.performance.now();

  // 1. 连接信令服务器
  connectSignalingServer();
}

function hangup() {
  console.log('Ending call');
  remoteVideo.pause();
  remoteVideo.srcObject = null;
  closeSignaling();
  if (pc != null) {
    pc.close();
  }
  pc = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}

/********************************** PeerConnection 相关 ****************************/
function createPeerConnection() {
  console.log('start create RTCPeerConnection');
  const configuration = {};
  console.log('RTCPeerConnection configuration:', configuration);
  // 创建 RTCPeerConnection 对象
  pc = new RTCPeerConnection(configuration);
  pc.onicecandidate = (event) => {
    // 如果收集到，就添加给 pc 连接状态
    if (event.candidate) {
      let message = {
        type: MESSAGETYPE.CANDITATE,
        data: event.candidate
      }
      sendMessage(message)
    }
  };
  pc.oniceconnectionstatechange = (event) => {
    console.log('ICE connection state change: ' + event.target.iceConnectionState);
    switch (event.target.iceConnectionState) {
      case "connected":
        // 1 V 1 连接已建立，可以断开信令服务器
        closeSignaling();
        break;
      case "disconnected":
        console.log("对方已挂断");
        hangup();
        break;
      default:
        break;
    }
  };
  pc.onaddstream = (event) => {
    // 监听是否有媒体流接入，如果有就赋值给 remoteVideo 的 src
    remoteVideo.srcObject = event.stream;
    remoteVideo.play();
    console.log('pc add stream: ' + event.stream);
  };

  console.log('end create RTCPeerConnection');
}

function requestLocalStream() {
  console.log('Request local stream');
  // 检测音视频设备
  let videoTracks = localStream.getVideoTracks();
  let audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }

  // 添加本地媒体流到PeerConnection
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  console.log('Added local stream to pc');
}

async function createAndSendOffer() {
  // 创建 offer
  let offer;
  try {
    console.log('create offer');
    offer = await pc.createOffer(offerOptions);
  } catch (e) {
    console.log(`Failed to create session description: ${e.toString()}`);
  }

  // 保存自身的 offer
  try {
    await pc.setLocalDescription(offer);
    console.log('setLocalDescription complete');
  } catch (e) {
    console.log(`Failed to set local session description: ${e.toString()}`);
  }

  // 发送 Offer
  try {
    let message = {
      type: MESSAGETYPE.OFFER,
      data: offer
    };
    await sendMessage(message);
  } catch (e) {
    console.log(`Failed to send session description: ${e.toString()}`);
  }
}

async function receiveOffer(offer) {
  try {
    await pc.setRemoteDescription(offer);
    console.log('receive offer');
    console.log(offer)
  } catch (e) {
    console.log(`Failed to set session description: ${e.toString()}`);
  }
}

async function createAndSendAnswer() {
  // 创建 answer
  let answer;
  try {
    console.log('create answer');
    answer = await pc.createAnswer();
  } catch (e) {
    console.log(`Failed to create session description: ${e.toString()}`);
  }

  // 保存自身的 offer
  try {
    await pc.setLocalDescription(answer);
    console.log('setLocalDescription complete');
  } catch (e) {
    console.log(`Failed to set local session description: ${e.toString()}`);
  }

  // 发送 Offer
  console.log('send answer to remote');
  try {
    let message = {
      type: MESSAGETYPE.ANSWER,
      data: answer
    };
    await sendMessage(message);
  } catch (e) {
    console.log(`Failed to send session description: ${e.toString()}`);
  }
}

async function receiveAnswer(answer) {
  try {
    console.log('add answer');
    console.log(answer);
    await pc.setRemoteDescription(answer);
  } catch (e) {
    console.log(`Failed to set session description: ${e.toString()}`);
  }
}

async function receiveCanditate(canditate) {
  try {
    console.log('add IceCandidate');
    console.log(canditate)
    await pc.addIceCandidate(canditate);
  } catch (e) {
    console.log(`Failed to add IceCandidate: ${e.toString()}`);
  }
}
/********************************** PeerConnection 相关 ****************************/

/********************************** 信令服务器相关 ****************************/
// 信令服务器地址
// 由于 WebRTC 的接口需要 SSL，所以我们必须使用 wss 访问信令服务器
// 为了支持 wss，使用了 Apache 的 SSL 端口进行了代理
// 所以这里访问的服务器地址不是 localhost:8888
// 配置文档：https://www.yuque.com/shusheng227/cglq4h/gieeye
const SIGNALING_SERVER = "wss://10.235.50.145:444/websocket";

const ID = {
  "CALLER" : "0",
  "CALLEE" : "1",
}

const MESSAGETYPE = {
  "REQUESTOFFER" : "RequestOffer",
  "OFFER" : "Offer",
  "ANSWER" : "Answer",
  "CANDITATE" : "Canditate",
}

let signalServer = null;
let id = ID.CALLEE

async function connectSignalingServer() {
  console.log("begin connect singaling server");
  signalServer = new WebSocket(SIGNALING_SERVER);

  signalServer.onopen = onSingalingOpen;

  signalServer.onmessage = onSingalingMessage;

  signalServer.onclose = onSingalingClose;
}

async function onSingalingOpen() {
  console.log("connect singaling server success");
}

async function onSingalingMessage(evt) {
  console.log("receive message: ")
  console.log(evt.data)
  let message = JSON.parse(evt.data);
  switch (message.type) {
    case MESSAGETYPE.REQUESTOFFER:
      id = ID.CALLER

      // 2. 创建 PeerConnection
      createPeerConnection();

      // 3. 添加本地视频流
      requestLocalStream()

      // 4. 创建 offer 并发送
      createAndSendOffer();
      break;
    case MESSAGETYPE.OFFER:
      // 5. callee 创建 PeerConnection
      createPeerConnection();

      // 6. callee 添加本地视频流
      requestLocalStream();

      // 7. callee 接收 offer
      let offer = new RTCSessionDescription(message.data);
      receiveOffer(offer);

      // 8. callee 创建并发送 answer
      createAndSendAnswer();
      break;
    case MESSAGETYPE.ANSWER:
      // 9. caller 接收 answer
      let answer = new RTCSessionDescription(message.data);
      receiveAnswer(answer);
      break;
    case MESSAGETYPE.CANDITATE:
      // 接收 canditate
      let canditate = new RTCIceCandidate(message.data);
      receiveCanditate(canditate);
      break;
    default:
      console.log("Invalid Message")
      break;
  }
}

async function onSingalingClose() {
  console.log("singaling server is closed");
  signalServer = null;
}

function closeSignaling() {
  if (signalServer == null) {
    return;
  }
  signalServer.close();
}

async function sendMessage(message) {
  message.id = message.id || id
  message = JSON.stringify(message)
  console.log('send message:');
  console.log(message)
  if (signalServer == null) {
    console.log("!!!!!!!!!!!!!!!!!!!");
    console.log("send message when signalServer is closed");
    return;
  }
  await signalServer.send(message);
}
/********************************** 信令服务器相关 ****************************/
