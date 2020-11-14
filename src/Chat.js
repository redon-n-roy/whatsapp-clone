import { Avatar, Button, IconButton, Tooltip } from '@material-ui/core'
import { AttachFile, MoreVert, SearchOutlined } from '@material-ui/icons'
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon'
import SendIcon from '@material-ui/icons/Send';
import React, { useEffect, useRef, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import './Chat.css'
import db from './firebase'
import { useStateValue } from './StateProvider'
import firebase from 'firebase'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import "emoji-mart/css/emoji-mart.css"
import { Picker } from "emoji-mart"
import imageCompression from 'browser-image-compression'
import { storage } from './firebase'
import { SRLWrapper } from "simple-react-lightbox"

const initialMsgState = {
    mouseX: null,
    mouseY: null,
};

function Chat() {

    const [input, setInput] = useState("");
    const { roomId } = useParams();
    const [roomName, setRoomName] = useState("");
    const [avatar, setAvatar] = useState("");
    const [messages, setMessages] = useState([]);
    const [admin, setAdmin] = useState("");
    const [{ user }, dispatch] = useStateValue();
    const [anchorEl, setAnchorEl] = useState(null);
    const history = useHistory();
    const bottomRef = useRef();
    const [valid,setValid] = useState(true);
    const [emojiVisibility, setEmojiVisibility] = useState(false);
    const [msgState, setMsgState] = useState(initialMsgState);
    const [delMsg,setDelMsg] = useState([])

    const handleMsgClick = (event,msg) => {
        event.preventDefault();
        setDelMsg(msg);
        setMsgState({
          mouseX: event.clientX - 2,
          mouseY: event.clientY - 4,
        });
    };
    
    const handleMsgClose = () => {
        setMsgState(initialMsgState);
        setDelMsg([]);
    };

    const deleteMsg = async(event) => {
        event.preventDefault();
        setMsgState(initialMsgState);
        await db.collection('rooms').doc(roomId).collection('messages').doc(delMsg.mid).delete();
        if(delMsg.image){
            await storage.refFromURL(delMsg.image).delete().catch(err => window.alert(err))
        }
        setDelMsg([]);
    }

    const scrollToBottom = () => {
        if(valid){
        bottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        });
        }
    }

    useEffect(() => {
        setTimeout(() => {
            scrollToBottom()
        },800)
        
    }, [messages])

    useEffect(() => {
        setTimeout(() => {
            scrollToBottom()
        },800)
        
    }, [roomId])

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
      };
    
    const handleDeleteRoom = async(e) => {
        e.preventDefault();
        setAnchorEl(null);

        if(admin === user.uid) {
            if(window.confirm("Do you want to delete the room?") === true && roomId) {
                await history.push("/");
                if(avatar){
                    await storage.refFromURL(avatar).delete().catch(err => window.alert(err))
                }
                await db.collection('rooms').doc(roomId).delete()
            }
        } else {
            window.alert("Only admin can delete the room")
        }
    };

    const handleDeleteDP = async(e) => {
        e.preventDefault();
        setAnchorEl(null);

        if(admin === user.uid) {
            if(avatar) {
                if(window.confirm("Do you want to delete DP for the room?") === true && roomId) {
                    await storage.refFromURL(avatar).delete().catch(err => window.alert(err))

                    await db.collection('rooms').doc(roomId).set({
                        avatar: ''
                    }, {merge: true});
                }
            } else {
                window.alert("DP doesn't exists");
            }} 
        else { 
            window.alert("Only admin can delete the DP");
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        const unsubscribe = db.collection('rooms').doc(roomId).onSnapshot(snapshot => (
            setValid(snapshot.exists)
        ))
        if(valid===false) {
            history.push("/");
        }
        return () => {
            unsubscribe();
        };
    })

    useEffect(() => {
        if(roomId) {
            const unsubscribe = db.collection('rooms').doc(roomId).onSnapshot(snapshot => (
                setRoomName(snapshot.data()?.name),
                setAvatar(snapshot.data()?.avatar),
                setAdmin(snapshot.data()?.admin)
            ));

            const unsubscribeTS = db.collection('rooms').doc(roomId).collection('messages')
            .orderBy('timestamp', 'asc').onSnapshot(snapshot => (
                setMessages(snapshot.docs?.map(doc => doc.data()))
            ))

            return () => {
                unsubscribe();
                unsubscribeTS();
            };
        }
    }, [roomId]);

    const sendMessage = async(e) => {
        e.preventDefault();

        if(input !== '') {
            const msgKey= await db.collection('rooms').doc(roomId).collection('messages').doc()
            msgKey.set({
                message: input,
                image: '',
                name: user.displayName,
                uid: user.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                mid: msgKey.id
            });
            db.collection('rooms').doc(roomId).set({
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }, {merge: true});
        }

        setInput("");
    };

    const uploadFile = async(file) => {
        const d = new Date();
        const storageRef = storage.ref()
        const fileRef = storageRef.child("WC-" + d.getTime() )
        await fileRef.put(file)
        const msgKey = db.collection('rooms').doc(roomId).collection('messages').doc()
        msgKey.set({
            message: '',
            image: await fileRef.getDownloadURL(),
            name: user.displayName,
            uid: user.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            mid: msgKey.id
        });
    };

    const uploadAvatar = async(avatarFile) => {
        if(admin === user.uid) {
            const d = new Date();
            const storageRef = storage.ref()
            const fileRef = storageRef.child("WC-avatar-" + d.getTime() )
            await fileRef.put(avatarFile)
            if(avatar){
                await storage.refFromURL(avatar).delete().catch(err => window.alert(err))
            }
            db.collection('rooms').doc(roomId).set({
                avatar: await fileRef.getDownloadURL()
            }, {merge: true});

            setAvatar("")
        } else {
            window.alert("Only admin can change the DP")
        }
    };

    const compressOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true
    }

    const compressAvatarOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 640,
        useWebWorker: true
    }

    const onFileChange = async(e) => {
        try{
            const compressedFile = await imageCompression(e.target.files[0], compressOptions);
            uploadFile(compressedFile);
        } catch (error) {
            alert("An error occured : " + error)
        }
        
    }

    const onAvatarChange = async(e) => {
        try{
            const compressedAvatar = await imageCompression(e.target.files[0], compressAvatarOptions);
            uploadAvatar(compressedAvatar);
        } catch (error) {
            alert("An error occured : " + error)
        }
        
    }

    const SRLoptions = {
        buttons: {
            showAutoplayButton: false,
            showDownloadButton: false,
            showNextButton: false,
            showPrevButton: false,
            showThumbnailsButton: false,
        },
        thumbnails: {
            showThumbnails: false,
        }
    }

    return valid ? (
        <div className='chat'>
            <div className="chat__header">
                <Tooltip title="View DP">
                <Button>
                <SRLWrapper options = {SRLoptions}>
                    <Avatar src={avatar ? avatar : `https://ui-avatars.com/api/?background=random&name=${roomName}`}/>
                </SRLWrapper>
                </Button>
                </Tooltip>
                <div className="chat__headerInfo">
                    <h3>{roomName}</h3>
                    <p>Last seen{" "}
                    {(messages[messages.length-1]?.timestamp) ? new Date(messages[messages.length-1]?.timestamp?.toDate()).toLocaleString([],{hour12:true}) : "Never"}
                    </p>
                </div>

                <div className="chat__headerRight">
                    <IconButton>
                        <SearchOutlined />
                    </IconButton>
                    <input accept="image/*" id="contained-button-file" type="file"
                    onChange={onFileChange} hidden
                    />
                    <Tooltip title="Send Image">
                    <IconButton>
                        <label className="chat__hiddenLabel" htmlFor="contained-button-file">
                            <AttachFile />
                        </label>
                    </IconButton>
                    </Tooltip>
                    <Tooltip title="More Options">
                    <IconButton aria-label="more" aria-controls="long-menu" aria-haspopup="true" onClick={handleClick}>
                        <MoreVert />
                    </IconButton>
                    </Tooltip>
                    <input accept="image/*" id="contained-button-avatar" type="file"
                        onChange={onAvatarChange} hidden
                    />
                    <Menu
                        id="simple-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                    <MenuItem onClick={handleDeleteRoom}>Delete room</MenuItem>
                    <MenuItem>
                    <label className="chat__hiddenLabel" htmlFor="contained-button-avatar">
                        Change DP
                    </label>
                    </MenuItem>
                    <MenuItem onClick={handleDeleteDP}>Delete DP</MenuItem>
                    </Menu>
                </div>
            </div>

            <div className="chat__body">
                {messages.map(message => (
                    <p className={`chat__message ${message.uid === user.uid && "chat__receiver"}`} 
                        onContextMenu={message.uid === user.uid ? (e) => {handleMsgClick(e, message)} : undefined}>
                        <span className="chat__name">{message.name}{admin===message.uid ? " (admin)" : ""}</span>
                        {message.message}
                        {
                            (message.image)?
                            <SRLWrapper options = {SRLoptions}>
                            <img className="chat__image" src={message.image}/>
                            </SRLWrapper> : ''
                        }
                        <span className="chat__timestamp">{new Date(message.timestamp?.toDate()).toLocaleString([],{hour12:true})}</span>
                        <Menu
                            keepMounted
                            open={msgState.mouseY !== null}
                            onClose={handleMsgClose}
                            anchorReference="anchorPosition"
                            anchorPosition={
                            msgState.mouseY !== null && msgState.mouseX !== null
                                ? { top: msgState.mouseY, left: msgState.mouseX }
                                : undefined
                            }
                        >
                            <MenuItem onClick={deleteMsg}>Delete</MenuItem>
                        </Menu>
                    </p>
                ))}
                <div ref={bottomRef} className="chat__bottomRef"></div>
            </div>

            <div className="chat__footer" >
                <div className="chat__footerEmojiDiv">
                    <div className="chat__footerEmoji" onBlur={() => setEmojiVisibility(false)}>
                        {emojiVisibility && <Picker
                            title="Pick your emoji…"
                            emoji="point_up"
                            set='twitter'
                            sheetSize='32'
                            onSelect={emoji => setInput(input + emoji.native)
                            }
                        />}
                    </div>
                </div>
                <Tooltip title="Choose Emoji" placement="top-start">
                <IconButton onClick={() => setEmojiVisibility(!emojiVisibility)}>
                    <InsertEmoticonIcon />
                </IconButton>
                </Tooltip>
                <form>
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message" 
                    type="text" onFocus={() => setEmojiVisibility(false)}/>
                    <button onClick={sendMessage} onFocus={() => setEmojiVisibility(false)} type="submit">Send a message</button>
                </form>
                <Tooltip title="Send Message" placement="top-end">
                <IconButton onClick={sendMessage} onFocus={() => setEmojiVisibility(false)}>
                    <SendIcon />
                </IconButton>
                </Tooltip>
            </div>
        </div>
    ) : (" ")

}

export default Chat
