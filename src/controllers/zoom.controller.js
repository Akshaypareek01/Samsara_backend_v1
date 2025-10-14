import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import qs from 'qs';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import cors from 'cors';
import KJUR from 'jsrsasign';
import jwt from 'jsonwebtoken';
import { Class, CustomSession, Event } from '../models/index.js';
import { createZoomMeeting as createZoomMeetingService, endZoomMeeting } from '../services/zoomService.js';

const CLIENT_ID = 'USSKQRgqQwGWNLpTjHStQ';
const CLIENT_SECRET = 'GkZ34TNaLUUsePqd0UkRmtJCM1uKa5mz';
const REDIRECT_URI = 'http://localhost:3000/';

export const getZoomToken = async (req, res) => {
    try {
        // Redirect users to the Zoom authorization URL
        const zoomAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
        res.redirect(zoomAuthUrl);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

export const getZoomCallback = async (req, res) => {
    try {
        // Handle the callback after the user grants/denies permission
        const code = req.query.code;

        if (!code) {
            return res.status(400).json({
                status: 'fail',
                message: 'Authorization code is required'
            });
        }

        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post(
            'https://zoom.us/oauth/token',
            qs.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Now, use the accessToken to fetch the Zoom token
        const userId = 'me'; // Replace with the actual user ID or 'me' for user-level apps
        const type = 'zak'; // You can also use 'token' here
        const ttl = 7200; // TTL in seconds

        const apiUrl = `https://api.zoom.us/v2/users/${userId}/token?type=${type}&ttl=${ttl}`;

        // Make the GET request to fetch the Zoom token using Axios
        const zoomTokenResponse = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (zoomTokenResponse.status === 200) {
            const zoomTokenData = zoomTokenResponse.data;
            const userToken = zoomTokenData.token;
            res.json({
                status: 'success',
                data: {
                    userToken
                }
            });
        } else {
            res.status(zoomTokenResponse.status).json({
                status: 'error',
                message: 'Failed to fetch Zoom token'
            });
        }
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

export const getAccessToken = async(req, res) => {
    try {
        const clientId = "_nLks8WMQDO1I34y6RQNXA";
        const clientSecret = "hw06ETTGZMJ8s4LnphEi9A5SVtQUQNZJ";
        const redirectUri = 'http://localhost:3000/';
        const codeVerifier = '';

        const grantType = 'account_credentials';

        const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;

        const requestBody = {
            grant_type: grantType,
            account_id: "C76CruAJSpitbs_UIRb4eQ"
        };

        const headers = {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        const response = await axios.post('https://zoom.us/oauth/token', null, {
            headers: headers,
            params: requestBody,
        });

        res.status(200).json({
            status: 'success',
            data: response.data
        });
    } catch (error) {
        console.error('Error requesting access token:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            status: 'error',
            message: error.message
        });
    }
}

export const fetchZoomTokenServerOauth = async (req, res) => {
    try {
        const { AccessTokenMain } = req.body;
        
        if (!AccessTokenMain) {
            return res.status(400).json({
                status: 'fail',
                message: 'Access token is required'
            });
        }

        const apiEndpoint = 'https://api.zoom.us/v2/users/me/token';
        const accessToken = AccessTokenMain;

        const apiUrl = `${apiEndpoint}?type=zak`;

        // Make the API request using Axios
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        // Parse and send the Zoom token as JSON response
        const data = response.data;
        console.log('Data Zak', data);
        res.json({
            status: 'success',
            data: {
                token: data.token
            }
        });
    } catch (error) {
        // Handle errors
        console.error('Error fetching Zoom token:', error.response?.data || error.message);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};

const updateClassMeetingInfo = async (classId, newMeetingNumber, newMeetingPassword) => {
    try {
        // Find the class by ID
        const foundClass = await Class.findById(classId);

        if (!foundClass) {
            throw new Error("Class not found");
        }

        // Update meeting number and password
        foundClass.meeting_number = newMeetingNumber;
        foundClass.password = newMeetingPassword;
        foundClass.status = true;
        // Save the updated class
        await foundClass.save();

        console.log("Class meeting information updated successfully", foundClass);
    } catch (error) {
        console.error("Error updating class meeting information:", error.message);
        throw error; // You can choose to handle or propagate the error as needed
    }
};

export const createZoomMeeting = async (req, res) => {
    try {
        const { token, data } = req.body;
        
        if (!token || !data) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token and meeting data are required'
            });
        }

        const meetingdata = data;
        
        // Use centralized Zoom service with multiple account support
        const meetingData = {
            topic: meetingdata.title,
            startTime: "2021-03-18T17:00:00",
            duration: 60,
            timezone: 'India',
            password: "",
            agenda: meetingdata.description,
            settings: {
                host_video: true,
                participant_video: true,
                cn_meeting: false,
                in_meeting: true,
                join_before_host: true,
                mute_upon_entry: false,
                watermark: false,
                use_pmi: false,
                approval_type: 1,
                audio: 'both',
                auto_recording: 'local',
                enforce_login: false,
                registrants_email_notification: false,
                waiting_room: false,
                allow_multiple_devices: true,
            },
        };

        // Create Zoom meeting using the centralized service
        const result = await createZoomMeetingService(meetingData);

        // Update class meeting info
        await updateClassMeetingInfo(meetingdata._id, result.meetingId, result.password);
        
        res.json({
            status: 'success',
            data: {
                meetingNumber: result.meetingId,
                password: result.password,
                joinUrl: result.joinUrl,
                accountUsed: result.accountUsed
            }
        });
    } catch (error) {
        console.error('Error creating meeting:', error.response?.data || error.message);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};

const updateSessionClassMeetingInfo = async (classId, newMeetingNumber, newMeetingPassword) => {
    try {
        // Find the class by ID
        const foundClass = await CustomSession.findById(classId);

        if (!foundClass) {
            throw new Error("Class not found");
        }

        // Update meeting number and password
        foundClass.meeting_number = newMeetingNumber;
        foundClass.password = newMeetingPassword;
        foundClass.status = true;
        // Save the updated class
        await foundClass.save();

        console.log("Class meeting information updated successfully", foundClass);
    } catch (error) {
        console.error("Error updating class meeting information:", error.message);
        throw error; // You can choose to handle or propagate the error as needed
    }
};

export const createSessionZoomMeeting = async (req, res) => {
    try {
        const { token, data } = req.body;
        
        if (!token || !data) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token and meeting data are required'
            });
        }

        const meetingdata = data;
        
        // Use centralized Zoom service with multiple account support
        const meetingData = {
            topic: meetingdata.title,
            startTime: "2021-03-18T17:00:00",
            duration: 60,
            timezone: 'India',
            password: "",
            agenda: meetingdata.description,
            settings: {
                host_video: true,
                participant_video: true,
                cn_meeting: false,
                in_meeting: true,
                join_before_host: true,
                mute_upon_entry: false,
                watermark: false,
                use_pmi: false,
                approval_type: 1,
                audio: 'both',
                auto_recording: 'local',
                enforce_login: false,
                registrants_email_notification: false,
                waiting_room: false,
                allow_multiple_devices: true,
            },
        };

        // Create Zoom meeting using the centralized service
        const result = await createZoomMeetingService(meetingData);

        // Update session meeting info
        await updateSessionClassMeetingInfo(meetingdata._id, result.meetingId, result.password);
        
        res.json({
            status: 'success',
            data: {
                meetingNumber: result.meetingId,
                password: result.password,
                joinUrl: result.joinUrl,
                accountUsed: result.accountUsed
            }
        });
    } catch (error) {
        console.error('Error creating meeting:', error.response?.data || error.message);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};

const updateEventClassMeetingInfo = async (classId, newMeetingNumber, newMeetingPassword) => {
    try {
        // Find the class by ID
        const foundClass = await Event.findById(classId);

        if (!foundClass) {
            throw new Error("Class not found");
        }

        // Update meeting number and password
        foundClass.meeting_number = newMeetingNumber;
        foundClass.password = newMeetingPassword;
        foundClass.status = true;
        // Save the updated class
        await foundClass.save();

        console.log("Class meeting information updated successfully", foundClass);
    } catch (error) {
        console.error("Error updating class meeting information:", error.message);
        throw error; // You can choose to handle or propagate the error as needed
    }
};

export const createEventZoomMeeting = async (req, res) => {
    try {
        const { token, data } = req.body;
        
        if (!token || !data) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token and meeting data are required'
            });
        }

        const meetingdata = data;
        
        // Use centralized Zoom service with multiple account support
        const meetingData = {
            topic: meetingdata.title,
            startTime: "2021-03-18T17:00:00",
            duration: 60,
            timezone: 'India',
            password: "",
            agenda: meetingdata.description,
            settings: {
                host_video: true,
                participant_video: true,
                cn_meeting: false,
                in_meeting: true,
                join_before_host: true,
                mute_upon_entry: false,
                watermark: false,
                use_pmi: false,
                approval_type: 1,
                audio: 'both',
                auto_recording: 'local',
                enforce_login: false,
                registrants_email_notification: false,
                waiting_room: false,
                allow_multiple_devices: true,
            },
        };

        // Create Zoom meeting using the centralized service
        const result = await createZoomMeetingService(meetingData);

        // Update event meeting info
        await updateEventClassMeetingInfo(meetingdata._id, result.meetingId, result.password);
        
        res.json({
            status: 'success',
            data: {
                meetingNumber: result.meetingId,
                password: result.password,
                joinUrl: result.joinUrl,
                accountUsed: result.accountUsed
            }
        });
    } catch (error) {
        console.error('Error creating meeting:', error.response?.data || error.message);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};

export const zoomuserInfo = async(req, res, next) => {
    try {
        const { token, email } = req.body;
        
        if (!token || !email) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token and email are required'
            });
        }

        const result = await axios.get("https://api.zoom.us/v2/users/" + email, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'User-Agent': 'Zoom-api-Jwt-Request',
                'content-type': 'application/json'
            }
        });
        
        res.status(200).json({
            status: 'success',
            data: result.data
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

export const deleteMeeting = async(req, res, next) => {
    try {
        const { token, meetingId } = req.body;
        
        if (!token || !meetingId) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token and meeting ID are required'
            });
        }

        const result = await axios.delete("https://api.zoom.us/v2/meetings/" + meetingId, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'User-Agent': 'Zoom-api-Jwt-Request',
                'content-type': 'application/json'
            }
        });
        
        res.status(200).json({
            status: 'success',
            data: result.data
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

export const getMeeting = async(req, res, next) => {
    try {
        const { token, meetingId } = req.body;
        
        if (!token || !meetingId) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token and meeting ID are required'
            });
        }

        const result = await axios.get("https://api.zoom.us/v2/meetings/" + meetingId, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'User-Agent': 'Zoom-api-Jwt-Request',
                'content-type': 'application/json'
            }
        });
        
        res.status(200).json({
            status: 'success',
            data: result.data
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}