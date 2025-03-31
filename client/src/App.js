import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [myId, setMyId] = useState("");
  const [peerId, setPeerId] = useState("");
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);
  const [stream, setStream] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const myStreamRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        myStreamRef.current = currentStream;
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      });

    socket.on("your-id", (id) => setMyId(id));

    socket.on("call-user", ({ from, signal }) => {
      setReceivingCall(true);
      setCaller(from);
      connectionRef.current = signal;
    });

    socket.on("call-ended", () => {
      endCall();
    });

    return () => {
      socket.off("your-id");
      socket.off("call-user");
      socket.off("call-ended");
    };
  }, []);

  const callUser = () => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (signal) => {
      socket.emit("call-user", { userToCall: peerId, signalData: signal, from: myId });
    });

    peer.on("stream", (userStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = userStream;
      }
    });

    socket.on("call-accepted", (signal) => {
      peer.signal(signal);
      setCallAccepted(true);
      setCallActive(true);
    });

    connectionRef.current = peer;
  };

  const acceptCall = () => {
    setCallAccepted(true);
    setCallActive(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (signal) => {
      socket.emit("accept-call", { to: caller, signal });
    });

    peer.on("stream", (userStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = userStream;
      }
    });

    peer.signal(connectionRef.current);
    connectionRef.current = peer;
  };

  const toggleMute = () => {
    stream.getAudioTracks()[0].enabled = isMuted;
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    stream.getVideoTracks()[0].enabled = !videoEnabled;
    setVideoEnabled(!videoEnabled);
  };

  const toggleFullscreen = (videoRef) => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setStream(screenStream);
      setScreenSharing(true);
      if (myVideo.current) {
        myVideo.current.srcObject = screenStream;
      }

      if (connectionRef.current) {
        connectionRef.current.replaceTrack(
          myStreamRef.current.getVideoTracks()[0],
          screenStream.getVideoTracks()[0],
          myStreamRef.current
        );
      }

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    setScreenSharing(false);
    setStream(myStreamRef.current);
    if (myVideo.current) {
      myVideo.current.srcObject = myStreamRef.current;
    }

    if (connectionRef.current) {
      connectionRef.current.replaceTrack(
        stream.getVideoTracks()[0],
        myStreamRef.current.getVideoTracks()[0],
        myStreamRef.current
      );
    }
  };

  const endCall = () => {
    setCallAccepted(false);
    setCallActive(false);
    setReceivingCall(false);
    socket.emit("end-call", { to: caller || peerId });
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
  };

  return (
    <div className="container">
      <h2>My Socket ID: {myId || "Connecting..."}</h2>

      <div className="controls">
        <h3>Enter Peer ID to Call:</h3>
        <input type="text" value={peerId} onChange={(e) => setPeerId(e.target.value)} />
        <button onClick={callUser} disabled={callActive}>Call</button>
      </div>

      {receivingCall && !callAccepted && (
        <div className="incoming-call">
          <h3>Incoming Call from {caller}...</h3>
          <button onClick={acceptCall}>Accept</button>
        </div>
      )}

      {callActive && (
        <div className="call-controls">
          <button onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
          <button onClick={toggleVideo}>{videoEnabled ? "Video Off" : "Video On"}</button>
          <button onClick={toggleScreenShare}>{screenSharing ? "Stop Sharing" : "Share Screen"}</button>
          <button className="hangup-btn" onClick={endCall}>Hang Up</button>
        </div>
      )}

      <div className="video-container">
        <div className="video-box">
          <h3>My Video</h3>
          <video ref={myVideo} autoPlay playsInline muted />
          <div className="controls-overlay">
            <button onClick={() => toggleFullscreen(myVideo)}>🔍</button>
          </div>
        </div>

        <div className="video-box">
          <h3>Peer Video</h3>
          {callAccepted ? (
            <video ref={userVideo} autoPlay playsInline />
          ) : (
            <p>Waiting for call...</p>
          )}
          <div className="controls-overlay">
            <button onClick={() => toggleFullscreen(userVideo)}>🔍</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
