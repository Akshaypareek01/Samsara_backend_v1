const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000/v1';
const email = 'test@gmail.com';
const otp = '1234';

async function testPCOS() {
    try {
        // Step 1: Send login OTP
        console.log('1. Sending login OTP...');
        const sendOTPResponse = await axios.post(`${BASE_URL}/auth/send-login-otp`, {
            email: email
        });
        
        if (sendOTPResponse.status === 200) {
            console.log('✅ OTP sent successfully');
        }
        
        // Wait a moment for OTP to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 2: Verify OTP and get token
        console.log('2. Verifying OTP...');
        const verifyOTPResponse = await axios.post(`${BASE_URL}/auth/verify-login-otp`, {
            email: email,
            otp: otp
        });
        
        if (verifyOTPResponse.status === 200 && verifyOTPResponse.data?.tokens?.access?.token) {
            const authToken = verifyOTPResponse.data.tokens.access.token;
            console.log('✅ OTP verified successfully');
            
            // Step 3: Test PCOS assessment creation
            console.log('3. Testing PCOS assessment creation...');
            const testData = {
                answers: {
                    lastCycleDate: new Date('2024-12-01'),
                    cycleRegularity: 'Irregular',
                    periodDuration: '3-5 days',
                    menstrualFlow: 'Normal',
                    bloodColor: 'Bright red',
                    facialHair: 'No',
                    weightGain: 'Yes',
                    foodCravings: 'Sugar and chocolate',
                    hormonalMedications: 'No',
                    periodPain: 'Bearable',
                    facialAcne: 'Yes',
                    lowLibido: 'No',
                    hairLoss: 'Normal',
                    darkSkinPatches: 'No',
                    difficultyConceiving: 'Other'
                }
            };
            
            const createResponse = await axios.post(`${BASE_URL}/pcos-assessment`, testData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (createResponse.status === 201 || createResponse.status === 200) {
                console.log('✅ PCOS Assessment created successfully!');
                console.log('Assessment ID:', createResponse.data.data.assessment._id);
                console.log('Risk Level:', createResponse.data.data.assessment.riskLevel);
                console.log('Total Score:', createResponse.data.data.assessment.totalScore);
                console.log('Cycle Length:', createResponse.data.data.assessment.cycleLength);
            }
            
        } else {
            console.log('❌ Failed to verify OTP');
        }
        
    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }
}

testPCOS();
