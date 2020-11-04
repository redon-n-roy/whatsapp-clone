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

function Chat() {

    const [input, setInput] = useState("");
    const { roomId } = useParams();
    const [roomName, setRoomName] = useState("");
    const [avatar, setAvatar] = useState("");
    const [messages, setMessages] = useState([]);
    const [{ user }, dispatch] = useStateValue();
    const [anchorEl, setAnchorEl] = useState(null);
    const history = useHistory();
    const bottomRef = useRef();
    const [valid,setValid] = useState(true);
    const [emojiVisibility, setEmojiVisibility] = useState(false);

    const scrollToBottom = () => {
        if(valid){
        bottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        });
        }
    }

   /* useEffect(() => {
        setTimeout(() => {
            scrollToBottom()
        },300)
        
    }, [messages]) */

    useEffect(() => {
        setTimeout(() => {
            scrollToBottom()
        },800)
        
    }, [messages.length-1])

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
      };
    
    const handleDeleteRoom = async(e) => {
        e.preventDefault();
        setAnchorEl(null);
        
        if(window.confirm("Do you want to delete the room?") == true && roomId) {
            await history.push("/");
            await db.collection('rooms').doc(roomId).delete()
        }
    };

    const handleDeleteDP = async(e) => {
        e.preventDefault();
        setAnchorEl(null);
        
        if(window.confirm("Do you want to delete DP for the room?") == true && roomId) {
            await storage.refFromURL(avatar).delete().catch(err => window.alert(err))

            await db.collection('rooms').doc(roomId).set({
                avatar: ''
            }, {merge: true});
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        db.collection('rooms').doc(roomId).onSnapshot(snapshot => (
            setValid(snapshot.exists)
        ))
    })

    useEffect(() => {
        if(roomId) {
            db.collection('rooms').doc(roomId).onSnapshot(snapshot => (
                setRoomName(snapshot.data()?.name),
                setAvatar(snapshot.data()?.avatar)
            ));

            db.collection('rooms').doc(roomId).collection('messages')
            .orderBy('timestamp', 'asc').onSnapshot(snapshot => (
                setMessages(snapshot.docs?.map(doc => doc.data()))
            ))
        }
    }, [roomId]);

    const sendMessage = async(e) => {
        e.preventDefault();

        if(input != '') {
            db.collection('rooms').doc(roomId).collection('messages').add({
                message: input,
                image: '',
                name: user.displayName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        setInput("");
    };

    const uploadFile = async(file) => {
        const d = new Date();
        const storageRef = storage.ref()
        const fileRef = storageRef.child("WC-" + d.getTime() )
        await fileRef.put(file)
        db.collection('rooms').doc(roomId).collection('messages').add({
            message: '',
            image: await fileRef.getDownloadURL(),
            name: user.displayName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()

        });
    };

    const uploadAvatar = async(avatar) => {
        const d = new Date();
        const storageRef = storage.ref()
        const fileRef = storageRef.child("WC-avatar-" + d.getTime() )
        await fileRef.put(avatar)
        db.collection('rooms').doc(roomId).set({
            avatar: await fileRef.getDownloadURL()
        }, {merge: true});

        setAvatar("")
    };

    const compressOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
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
            const compressedFile = await imageCompression(e.target.files[0], compressOptions);
            uploadAvatar(compressedFile);
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

    if(valid) {
    return (
        <div className='chat'>
            <div className="chat__header">
                <input accept="image/*" id="contained-button-avatar" type="file"
                    onChange={onAvatarChange} hidden
                />
                <Tooltip title="Change DP">
                <Button>
                <label className="chat__hiddenLabel" htmlFor="contained-button-avatar">
                    <Avatar src={avatar ? avatar : `https://ui-avatars.com/api/?background=random&name=${roomName}`}/>
                </label>
                </Button>
                </Tooltip>
                <div className="chat__headerInfo">
                    <h3>{roomName}</h3>
                    <p>Last seen{" "}
                    {(messages[messages.length-1]?.timestamp) ? new Date(messages[messages.length-1]?.timestamp?.toDate()).toUTCString() : "Never"}
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
                    <Menu
                        id="simple-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                    <MenuItem onClick={handleDeleteRoom}>Delete room</MenuItem>
                    <MenuItem onClick={handleDeleteDP}>Delete DP</MenuItem>   
                    </Menu>
                </div>
            </div>

            <div className="chat__body">
                {messages.map(message => (
                    <p className={`chat__message ${message.name === user.displayName && "chat__receiver"}`}>
                        <span className="chat__name">{message.name}</span>
                        {message.message}
                        {
                            (message.image)?
                            <SRLWrapper options = {SRLoptions}>
                            <img className="chat__image" src={message.image}/>
                            </SRLWrapper> : ''
                        }
                        <span className="chat__timestamp">{new Date(message.timestamp?.toDate()).toUTCString()}</span>
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
                <IconButton onClick={() => setEmojiVisibility(!emojiVisibility)} onBlur={() => setEmojiVisibility(false)}>
                    <InsertEmoticonIcon />
                </IconButton>
                </Tooltip>
                <form>
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message" 
                    type="text" />
                    <button onClick={sendMessage} type="submit">Send a message</button>
                </form>
                <Tooltip title="Send Message" placement="top-end">
                <IconButton onClick={sendMessage}>
                    <SendIcon />
                </IconButton>
                </Tooltip>
            </div>
        </div>
    )
    } else {
        return("")
    }
}

export default Chat
