import React,  { Component } from 'react';
import AgoraRTC from 'agora-rtc-sdk';

let client = AgoraRTC.createClient({ mode: "live", codec: "h264" });

const USER_ID = Math.floor(Math.random() * 1000000001);

export default class Call extends Component {
    localStream = AgoraRTC.createStream({
        streamID: USER_ID,
        audio: true,
        video: true,
        screen: false
    });

    state = {
        remoteStreams: []
    }

    componentDidMount() {
        this.initLocalStream();
        this.initClient();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.channel !== this.props.channel && this.props.channel !== '') {
            this.joinChannel();
        }
    }

    initLocalStream = () => {
        let me = this;
        me.localStream.init(
            function() {
                console.log("getUserMedia successfully");
                me.localStream.play("agora_local");
            },
            function(err) {
                console.log("getUserMedia failed", err);
            }
        )
    }

    initClient = () => {
        client.init(
            'fa70793fb85d4c89aba6eb70f99bcea3',
            function() {
                console.log("AgoraRTC client intiialized");
            },
            function(err) {
                console.log("AgoraRTC client init failed", err);
            }
        );
        this.subscribeToClient();
    }

    subscribeToClient = () => {
        let me = this;
        client.on("stream-added", me.onStreamAdded);
        client.on("stream-subscribed", me.onRemoteClientAdded);
    
        client.on("stream-removed", me.onStreamRemoved);
    
        client.on("peer-leave", me.onPeerLeave);
      };

    onStreamAdded = evt => {
        let me = this;
        let stream = evt.stream;
        console.log("New stream added: " + stream.getId());
        me.setState(
          {
            remoteStreams: {
              ...me.state.remoteStreams,
              [stream.getId()]: stream
            }
          },
            () => {
                client.subscribe(stream, function(err) {
                    console.log("Subscribe stream failed", err);
                });
            }
        );
    };

    joinChannel = () => {
        let me = this;
        client.join(
            null,
            me.props.channel,
            USER_ID,
            function(uid) {
                console.log("User " + uid + " join channel successfully");
                client.publish(me.localStream, function(err) {
                    console.log("Publish local stream error: " + err);
                });

                client.on("stream-published", function(evt) {
                    console.log("Publish local stream successfully");
                });
            },
            function(err) {
                console.log("Join channel failed", err);
            }
        );
    };

    handleCamera = (e) => {
        e.currentTarget.classList.toggle('off');
        this.localStream.isVideoOn() ?
            this.localStream.disableVideo() :
            this.localStream.enableVideo();
            console.log("camera toggle")
    };

    handleMic = (e) => {
        e.currentTarget.classList.toggle('off');
        this.localStream.isAudioOn() ?
            this.localStream.disableAudio() :
            this.localStream.enableAudio();
            console.log("mic toggle")
    }
 
    onStreamRemoved = evt => {
        let me = this;
        let stream = evt.stream;
        if (stream) {
            let streamId = stream.getId();
            let { remoteStreams } = me.state;

            stream.stop();
            delete remoteStreams[streamId];

            me.setState({ remoteStreams });

            console.log("remote stream is removed " + stream.getId());
        }
    };

    onPeerLeave = evt => {
        let me = this;
        let stream = evt.stream;
        if (stream) {
          let streamId = stream.getId();
          let { remoteStreams } = me.state;
    
          stream.stop();
          delete remoteStreams[streamId];
    
          me.setState({ remoteStreams });
    
          console.log("Remote stream is removed " + stream.getId());
        }
      };

    onRemoteClientAdded = evt => {
        let me =this;
        let remoteStream = evt.stream;
        me.state.remoteStreams[remoteStream.getId()].play(
            "agora_remote " + remoteStream.getId()
        );
    };
    
    render() {
        return (
            <div>
                Video Call Component
                <div id="agora_local" style={{ width: "400px", height: "400px" }} />
                {Object.keys(this.state.remoteStreams).map(key => {
                    let stream = this.state.remoteStreams[key];
                    let streamId = stream.getId();
                    return (
                        <div>

                            <div    
                                key={streamId}
                                id={`agora_remote ${streamId}`}
                                style={{ width: "400px", height: "400px" }}
                            />
                            
                        </div>
                    );
                })}
                <button onClick={this.handleMic}>Mic</button> 
                <button onClick={this.handleCamera}>Video</button>
            </div>
        )
    }
}