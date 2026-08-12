import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import qs from 'qs';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import cors from 'cors';
import KJUR from 'jsrsasign';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { Class, CustomSession, Event } from '../models/index.js';
import isAdminUser from '../utils/isAdminUser.js';
import {
  createZoomMeeting as createZoomMeetingService,
  generateSDKSignature,
  getZoomZakToken,
  getAccountById,
  getZoomOAuthToken,
  validAccounts,
  buildZoomWcHostStartUrl,
  patchMeetingPrivacySettings,
  endOtherLiveMeetingsForAccount,
} from '../services/zoomService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        // Prefer account_2 (active); fall back to account_1 only if still configured in env
        const clientId = process.env.ZOOM_CLIENT_ID_2 || process.env.ZOOM_CLIENT_ID_1;
        const clientSecret = process.env.ZOOM_CLIENT_SECRET_2 || process.env.ZOOM_CLIENT_SECRET_1;
        const accountId = process.env.ZOOM_ACCOUNT_ID_2 || process.env.ZOOM_ACCOUNT_ID_1;

        if (!clientId || !clientSecret || !accountId) {
            return res.status(500).json({
                status: 'error',
                message: 'Zoom credentials not configured in environment'
            });
        }

        const grantType = 'account_credentials';

        const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;

        const requestBody = {
            grant_type: grantType,
            account_id: accountId
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

const updateClassMeetingInfo = async (classId, newMeetingNumber, newMeetingPassword, zoomAccountUsed, meetingResult = null) => {
    try {
        // Find the class by ID
        const foundClass = await Class.findById(classId);

        if (!foundClass) {
            throw new Error("Class not found");
        }

        // Update meeting number, password, and account used
        foundClass.meeting_number = newMeetingNumber;
        foundClass.password = newMeetingPassword;
        foundClass.status = true;
        foundClass.zoomAccountUsed = zoomAccountUsed; // Track which account was used
        
        // Update with latest meeting data if available
        if (meetingResult) {
            foundClass.zoomJoinUrl = meetingResult.joinUrl;
            foundClass.zoomStartUrl = meetingResult.meetingData?.start_url || meetingResult.joinUrl;
            foundClass.zoomMeetingId = meetingResult.meetingData?.id || newMeetingNumber;
            
            if (meetingResult.meetingData?.settings) {
                foundClass.zoomSettings = {
                    hostVideo: meetingResult.meetingData.settings.host_video || true,
                    participantVideo: meetingResult.meetingData.settings.participant_video || true,
                    joinBeforeHost: meetingResult.meetingData.settings.join_before_host || true,
                    autoRecording: meetingResult.meetingData.settings.auto_recording || 'local',
                    waitingRoom: meetingResult.meetingData.settings.waiting_room || false,
                };
            }
        }
        
        // Save the updated class
        await foundClass.save();

        console.log("Class meeting information updated successfully with latest features", foundClass);
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

        // Update class meeting info with latest features
        await updateClassMeetingInfo(meetingdata._id, result.meetingId, result.password, result.accountUsed, result);
        
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

const updateSessionClassMeetingInfo = async (classId, newMeetingNumber, newMeetingPassword, zoomAccountUsed) => {
    try {
        // Find the class by ID
        const foundClass = await CustomSession.findById(classId);

        if (!foundClass) {
            throw new Error("Class not found");
        }

        // Update meeting number, password, and account used
        foundClass.meeting_number = newMeetingNumber;
        foundClass.password = newMeetingPassword;
        foundClass.status = true;
        foundClass.zoomAccountUsed = zoomAccountUsed; // Track which account was used
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
        await updateSessionClassMeetingInfo(meetingdata._id, result.meetingId, result.password, result.accountUsed);
        
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

const updateEventClassMeetingInfo = async (classId, newMeetingNumber, newMeetingPassword, zoomAccountUsed) => {
    try {
        // Find the class by ID
        const foundClass = await Event.findById(classId);

        if (!foundClass) {
            throw new Error("Class not found");
        }

        // Update meeting number, password, and account used
        foundClass.meeting_number = newMeetingNumber;
        foundClass.password = newMeetingPassword;
        foundClass.status = true;
        foundClass.zoomAccountUsed = zoomAccountUsed; // Track which account was used
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
        await updateEventClassMeetingInfo(meetingdata._id, result.meetingId, result.password, result.accountUsed);
        
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

/**
 * Whether this caller may take the host branch for a meeting.
 *
 * Host access is decided from the meeting record's assigned teacher, never
 * from the `role` field in the request body.
 *
 * @param {object|null} caller - req.user
 * @param {{classId?:string, sessionId?:string, eventId?:string, meetingNumber?:string|number}} ids
 * @returns {Promise<boolean>}
 */
const callerMayHostMeeting = async (caller, ids = {}) => {
    if (!caller) return false;

    // CRM staff (admin/trainer/company) run sessions on behalf of the platform.
    if (isAdminUser(caller) || caller.role === 'trainer' || caller.role === 'company') {
        return true;
    }

    const callerId = String(caller.id ?? caller._id ?? '');
    if (!callerId) return false;

    const { classId, sessionId, eventId, meetingNumber } = ids;
    const meetingNo = meetingNumber != null ? String(meetingNumber) : null;

    /** @param {any} doc */
    const ownsDoc = (doc) => {
        if (!doc) return false;
        const teacherId = String(doc.teacher?._id ?? doc.teacher ?? '');
        return Boolean(teacherId) && teacherId === callerId;
    };

    if (classId) return ownsDoc(await Class.findById(classId).select('teacher'));
    if (sessionId) return ownsDoc(await CustomSession.findById(sessionId).select('teacher'));
    if (eventId) return ownsDoc(await Event.findById(eventId).select('teacher'));

    // No id supplied — fall back to locating the meeting by number.
    if (meetingNo) {
        const byNumber =
            (await Class.findOne({ meeting_number: meetingNo }).select('teacher')) ||
            (await CustomSession.findOne({ meeting_number: meetingNo }).select('teacher')) ||
            (await Event.findOne({ meeting_number: meetingNo }).select('teacher'));
        return ownsDoc(byNumber);
    }

    return false;
};

/**
 * Generate SDK signature for joining Zoom meetings
 * This endpoint generates the signature using the correct SDK key/secret
 * based on the account that created the meeting
 */
export const generateMeetingSDKSignature = async (req, res) => {
    try {
        const { meetingNumber, role, accountId, classId, sessionId, eventId } = req.body;
        
        // Validate required fields
        if (!meetingNumber) {
            return res.status(400).json({
                status: 'fail',
                message: 'Meeting number is required'
            });
        }

        // Default role to participant (0) if not provided.
        // Only role === 1 mints ZAK; everything else is attendee signature only (no ZAK).
        const requestedRole = Number(role);
        let isHostRequest = requestedRole === 1;

        // A host signature grants meeting control AND ends every other live
        // meeting on the account. The client asks for role 1; only the assigned
        // teacher (or CRM staff) may actually receive it.
        if (isHostRequest) {
            const allowed = await callerMayHostMeeting(req.user, { classId, sessionId, eventId, meetingNumber });
            if (!allowed) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'You are not the host of this meeting.',
                });
            }
        }

        const userRole = isHostRequest ? 1 : 0;

        let zoomAccountId = accountId;

        // If accountId not provided, try to look it up from meeting data
        if (!zoomAccountId) {
            if (classId) {
                const classDoc = await Class.findById(classId);
                if (classDoc && classDoc.zoomAccountUsed) {
                    zoomAccountId = classDoc.zoomAccountUsed;
                }
            } else if (sessionId) {
                const sessionDoc = await CustomSession.findById(sessionId);
                if (sessionDoc && sessionDoc.zoomAccountUsed) {
                    zoomAccountId = sessionDoc.zoomAccountUsed;
                }
            } else if (eventId) {
                const eventDoc = await Event.findById(eventId);
                if (eventDoc && eventDoc.zoomAccountUsed) {
                    zoomAccountId = eventDoc.zoomAccountUsed;
                }
            }

            // If still not found, try to find by meeting number in any collection
            if (!zoomAccountId) {
                const classWithMeeting = await Class.findOne({ meeting_number: meetingNumber.toString() });
                if (classWithMeeting && classWithMeeting.zoomAccountUsed) {
                    zoomAccountId = classWithMeeting.zoomAccountUsed;
                } else {
                    const sessionWithMeeting = await CustomSession.findOne({ meeting_number: meetingNumber.toString() });
                    if (sessionWithMeeting && sessionWithMeeting.zoomAccountUsed) {
                        zoomAccountId = sessionWithMeeting.zoomAccountUsed;
                    } else {
                        const eventWithMeeting = await Event.findOne({ meeting_number: meetingNumber.toString() });
                        if (eventWithMeeting && eventWithMeeting.zoomAccountUsed) {
                            zoomAccountId = eventWithMeeting.zoomAccountUsed;
                        }
                    }
                }
            }
        }

        // If still no account ID found, default to first configured Zoom account
        if (!zoomAccountId) {
            zoomAccountId = validAccounts[0]?.id || 'account_1';
            console.warn(
                `Account ID not found for meeting ${meetingNumber}, defaulting to ${zoomAccountId}`
            );
        }

        // Participant join: signature only — never return zak for attendees
        if (!isHostRequest) {
            const signatureData = generateSDKSignature(meetingNumber, 0, zoomAccountId);
            return res.json({
                status: 'success',
                data: {
                    signature: signatureData.signature,
                    sdkKey: signatureData.sdkKey,
                    accountId: signatureData.accountId,
                    meetingNumber: meetingNumber,
                    role: 0,
                    // Explicit: no zak for attendees
                }
            });
        }

        // Host join: end OTHER live sessions on this Zoom user, then mint ZAK.
        // Never end the meeting being started (exceptMeetingId = this meetingNumber).
        try {
            await endOtherLiveMeetingsForAccount(zoomAccountId, meetingNumber);
        } catch (endErr) {
            console.warn(
                'Could not clear other live Zoom sessions before host join:',
                endErr.response?.data || endErr.message
            );
        }

        let zak = null;
        let hostEmail = null;
        let hostName = null;
        let zoomAccountType = null;
        try {
            const zakData = await getZoomZakToken(zoomAccountId, meetingNumber);
            zak = zakData.zak;
            hostEmail = zakData.hostEmail;
            hostName = zakData.hostName;
            zoomAccountType = zakData.accountType;
        } catch (zakError) {
            console.error('Failed to fetch ZAK for host join:', zakError.response?.data || zakError.message);
            return res.status(500).json({
                status: 'error',
                message:
                    'Failed to get Zoom host token (ZAK). Ensure Server-to-Server OAuth has user:read:admin / user:read:token:admin scopes.',
                details: zakError.response?.data || zakError.message,
            });
        }

        const signatureData = generateSDKSignature(meetingNumber, userRole, zoomAccountId);
        return res.json({
            status: 'success',
            data: {
                signature: signatureData.signature,
                sdkKey: signatureData.sdkKey,
                accountId: signatureData.accountId,
                meetingNumber: meetingNumber,
                role: userRole,
                zak,
                hostEmail,
                hostName,
                zoomAccountType,
            }
        });
    } catch (error) {
        console.error('Error generating SDK signature:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to generate SDK signature'
        });
    }
};

/**
 * Get meeting details from class/session/event (auth required).
 * Query: classId|sessionId|eventId, asHost=1 for teacher/admin host-start URL (ZAK).
 * Participants never receive startUrl/ZAK — only a join URL after enrollment check.
 */
export const getMeetingDetails = async (req, res) => {
    try {
        const { classId, sessionId, eventId } = req.query;
        const asHost = String(req.query.asHost || '') === '1' || String(req.query.asHost || '').toLowerCase() === 'true';
        const user = req.user;
        const userId = String(user?.id || user?._id || '');
        const isStaff =
            user?.role === 'admin' ||
            user?.role === 'company' ||
            user?.role === 'trainer' ||
            (user?.role && typeof user.role === 'object'); // populated Admin Role

        let meetingData = null;
        let docTeacherId = null;
        let docStudents = [];

        if (classId) {
            const classDoc = await Class.findById(classId);
            if (!classDoc) {
                return res.status(404).json({ status: 'fail', message: 'Class not found' });
            }
            if (!classDoc.meeting_number) {
                return res.status(400).json({ status: 'fail', message: 'No meeting created for this class yet' });
            }
            docTeacherId = classDoc.teacher ? String(classDoc.teacher._id || classDoc.teacher) : null;
            docStudents = classDoc.students || [];
            meetingData = {
                meetingNumber: classDoc.meeting_number,
                password: classDoc.password || '',
                accountId: classDoc.zoomAccountUsed,
                joinUrl: classDoc.zoomJoinUrl || null,
                startUrl: classDoc.zoomStartUrl || null,
            };
        } else if (sessionId) {
            const sessionDoc = await CustomSession.findById(sessionId);
            if (!sessionDoc) {
                return res.status(404).json({ status: 'fail', message: 'Session not found' });
            }
            if (!sessionDoc.meeting_number) {
                return res.status(400).json({ status: 'fail', message: 'No meeting created for this session yet' });
            }
            docTeacherId = sessionDoc.teacher ? String(sessionDoc.teacher._id || sessionDoc.teacher) : null;
            docStudents = sessionDoc.students || (sessionDoc.user ? [sessionDoc.user] : []);
            meetingData = {
                meetingNumber: sessionDoc.meeting_number,
                password: sessionDoc.password || '',
                accountId: sessionDoc.zoomAccountUsed,
                joinUrl: sessionDoc.zoomJoinUrl || null,
                startUrl: sessionDoc.zoomStartUrl || null,
            };
        } else if (eventId) {
            const eventDoc = await Event.findById(eventId);
            if (!eventDoc) {
                return res.status(404).json({ status: 'fail', message: 'Event not found' });
            }
            if (!eventDoc.meeting_number) {
                return res.status(400).json({ status: 'fail', message: 'No meeting created for this event yet' });
            }
            docTeacherId = eventDoc.teacher ? String(eventDoc.teacher._id || eventDoc.teacher) : null;
            docStudents = eventDoc.students || eventDoc.registeredUsers || [];
            meetingData = {
                meetingNumber: eventDoc.meeting_number,
                password: eventDoc.password || '',
                accountId: eventDoc.zoomAccountUsed,
                joinUrl: eventDoc.zoomJoinUrl || null,
                startUrl: eventDoc.zoomStartUrl || null,
            };
        } else {
            return res.status(400).json({
                status: 'fail',
                message: 'classId, sessionId, or eventId is required'
            });
        }

        const isTeacherOfDoc = docTeacherId && userId && docTeacherId === userId;
        const isEnrolled = (docStudents || []).some((s) => String(s?._id || s) === userId);

        if (!isStaff && !isTeacherOfDoc && !isEnrolled) {
            return res.status(403).json({
                status: 'fail',
                message: 'You are not allowed to join this private meeting',
            });
        }

        if (asHost && !isStaff && !isTeacherOfDoc) {
            return res.status(403).json({
                status: 'fail',
                message: 'Only the class teacher or staff can start as host',
            });
        }

        // Refresh join_url from Zoom when missing
        if (!meetingData.joinUrl && meetingData.meetingNumber) {
            try {
                const account =
                    getAccountById(meetingData.accountId || validAccounts[0]?.id) ||
                    validAccounts[0];
                if (account) {
                    const zoomToken = await getZoomOAuthToken(account);
                    const zoomMeeting = await axios.get(
                        `https://api.zoom.us/v2/meetings/${meetingData.meetingNumber}`,
                        {
                            headers: { Authorization: `Bearer ${zoomToken}` },
                            timeout: 15000,
                        }
                    );
                    meetingData.joinUrl = zoomMeeting.data?.join_url || null;
                    meetingData.startUrl = zoomMeeting.data?.start_url || meetingData.startUrl;
                    if (zoomMeeting.data?.password && !meetingData.password) {
                        meetingData.password = zoomMeeting.data.password;
                    }
                }
            } catch (zoomLookupError) {
                console.warn(
                    'Could not refresh join_url from Zoom API:',
                    zoomLookupError.response?.data || zoomLookupError.message
                );
            }
        }

        if (!meetingData.joinUrl && meetingData.meetingNumber) {
            const pwd = meetingData.password
                ? `?pwd=${encodeURIComponent(meetingData.password)}`
                : '';
            meetingData.joinUrl = `https://zoom.us/wc/join/${meetingData.meetingNumber}${pwd}`;
        }

        // Harden privacy on every authorized fetch (covers older meetings)
        await patchMeetingPrivacySettings(
            meetingData.meetingNumber,
            meetingData.accountId || validAccounts[0]?.id
        );

        const responseData = {
            meetingNumber: meetingData.meetingNumber,
            password: meetingData.password,
            joinUrl: meetingData.joinUrl,
            accountId: meetingData.accountId,
            asHost: false,
            hostStartUrl: null,
        };

        if (asHost) {
            // Meeting SDK role=1 + ZAK = real host (CRM admin/trainer on desktop web).
            // Mobile teachers on Zoom Basic → WC participant (SDK host lock is permanent on Basic).
            let zoomAccountType = null;
            let zakForStart = null;
            try {
                const zakInfo = await getZoomZakToken(
                    meetingData.accountId || validAccounts[0]?.id,
                    meetingData.meetingNumber
                );
                zoomAccountType = zakInfo.accountType;
                zakForStart = zakInfo.zak;
            } catch (typeErr) {
                console.warn('Could not read Zoom account type / ZAK:', typeErr.message);
            }

            const isBasicZoom = zoomAccountType === 1;
            // CRM staff always get SDK host path (desktop browser). App teachers on Basic do not.
            // Consumer web teachers pass forceHost=1 directly on join-meeting (same as CRM).
            const useSdkHost = isStaff || !isBasicZoom;

            responseData.asHost = true;
            responseData.zoomAccountType = zoomAccountType;

            if (!useSdkHost) {
                try {
                    const account =
                        getAccountById(meetingData.accountId || validAccounts[0]?.id) ||
                        validAccounts[0];
                    if (account) {
                        const zoomToken = await getZoomOAuthToken(account);
                        await axios.patch(
                            `https://api.zoom.us/v2/meetings/${meetingData.meetingNumber}`,
                            {
                                settings: {
                                    join_before_host: true,
                                    waiting_room: false,
                                    show_share_button: false,
                                    private_meeting: true,
                                },
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${zoomToken}`,
                                    'Content-Type': 'application/json',
                                },
                                timeout: 15000,
                            }
                        );
                    }
                } catch (patchErr) {
                    console.warn(
                        'Basic instructor JBH patch failed:',
                        patchErr.response?.data || patchErr.message
                    );
                }
                responseData.hostMode = 'web_participant';
                responseData.useMeetingSdk = false;
                responseData.sdkJoinPath = null;
                responseData.hostNote =
                    'Zoom Basic cannot host via Meeting SDK on mobile. Joining as instructor in the web client.';
            } else {
                try {
                    await endOtherLiveMeetingsForAccount(
                        meetingData.accountId || validAccounts[0]?.id,
                        meetingData.meetingNumber
                    );
                } catch (clearErr) {
                    console.warn(
                        'Could not clear other live meetings for CRM host join:',
                        clearErr.message
                    );
                }

                const sdkParams = new URLSearchParams({
                    role: '1',
                    forceHost: '1',
                });
                if (classId) sdkParams.set('classId', String(classId));
                if (sessionId) sdkParams.set('sessionId', String(sessionId));
                if (eventId) sdkParams.set('eventId', String(eventId));
                if (meetingData.meetingNumber) {
                    sdkParams.set('meetingNumber', String(meetingData.meetingNumber));
                }
                if (meetingData.password) {
                    sdkParams.set('password', String(meetingData.password));
                }
                if (meetingData.accountId) {
                    sdkParams.set('accountId', String(meetingData.accountId));
                }

                responseData.hostMode = 'sdk';
                responseData.useMeetingSdk = true;
                responseData.sdkJoinPath = `/zoom/join-meeting?${sdkParams.toString()}`;
                // Optional: classic start_url with fresh ZAK for desktop Zoom client
                if (zakForStart && meetingData.meetingNumber) {
                    const origin = (() => {
                        try {
                            return meetingData.joinUrl
                                ? new URL(meetingData.joinUrl).origin
                                : 'https://zoom.us';
                        } catch {
                            return 'https://zoom.us';
                        }
                    })();
                    responseData.hostStartUrl = `${origin}/s/${meetingData.meetingNumber}?zak=${encodeURIComponent(zakForStart)}`;
                }
            }
        }

        res.json({
            status: 'success',
            data: responseData,
        });
    } catch (error) {
        console.error('Error fetching meeting details:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to fetch meeting details'
        });
    }
};

/**
 * Serve the public meeting join page
 * Sets required CORS headers for SharedArrayBuffer support (gallery view)
 */
export const serveJoinMeetingPage = async (req, res) => {
    try {
        // Do NOT set COEP/COOP — require-corp breaks Zoom SDK CDN loads in mobile WebViews.
        const publicPath = path.join(__dirname, '../../public/join-meeting.html');
        res.sendFile(publicPath);
    } catch (error) {
        console.error('Error serving join meeting page:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to load meeting page'
        });
    }
};
