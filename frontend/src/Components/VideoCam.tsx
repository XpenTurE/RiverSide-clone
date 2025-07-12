import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:8000/');    

const VideoCam = () => {
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const [stream,setLocalStream] = useState<MediaStream | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const [recordedChunks,setRecordedChunks] = useState<Blob[]>([])
    const startButtonRef = useRef<HTMLButtonElement>(null)
    const stopButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(()=>{
        const initWebRTC = async()=>{
            try{
                const localStream = await navigator.mediaDevices.getUserMedia({
                    audio:true,
                    video: { width: 1920, height: 1080 },
                })
                
                if(localVideoRef.current){
                    localVideoRef.current.srcObject = localStream
                }
                setLocalStream(localStream) 

            }
            catch(err){
                console.log(err)
            }
        }
        initWebRTC()
    },[])

    const handleStartRecording = ()=>{
        if(stream){
            const recorder:MediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = recorder
            const chunks :Blob[] = []
        
            socket.emit('recording_start');
            
            recorder.ondataavailable = async (event)=>{
                console.log(event)
                if(event.data.size > 0){
                    chunks.push(event.data)
                
                    const reader = new FileReader();
                    reader.onload = () => {
                        socket.emit('video_chunk', reader.result);
                    };
                    reader.readAsArrayBuffer(event.data);
                }
            }

            recorder.onstop = ()=>{
                setRecordedChunks(chunks)
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = 'recording1.webm'
                a.click()
                
                socket.emit('recording_end');
            }

            recorder.start(1000)
            if(startButtonRef.current)startButtonRef.current.disabled = true
            if(stopButtonRef.current)stopButtonRef.current.disabled = false
            console.log('recording start..')
        }
    }

    const handleStopRecording = ()=>{
        if(mediaRecorderRef.current){
            mediaRecorderRef.current.stop()
            if(startButtonRef.current)startButtonRef.current.disabled = false
            if(stopButtonRef.current)stopButtonRef.current.disabled = true
        } 
     }

  return (
    <div>
      <video ref={localVideoRef} width={900} autoPlay muted playsInline></video><br></br>
       <button ref={startButtonRef} onClick={handleStartRecording} >Start Recording</button>
      <button ref={stopButtonRef} onClick={handleStopRecording}>Stop Recording</button>
    </div>
  )
}

export default VideoCam