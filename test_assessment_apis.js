import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000/v1';
const USER_ID = '686225adf7366b36a48fa65e';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYyMjVhZGY3MzY2YjM2YTQ4ZmE2NWUiLCJ0eXBlIjoiYWNjZXNzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ2NzY5NjcsImV4cCI6MTc1NDc2MzM2N30.egZmw7WqoI-5mbK42xNjSDgZf82QLo08gsrTXV-cLA4';

// Test data for different assessments
const testData = {
    menopause: {
        answers: {
            irregularPeriods: 'Sometimes',
            fatigue: 'Often tired',
            weightChanges: 'Slight weight gain',
            sleepQuality: 'Poor sleep',
            moodSwings: 'Frequently'
        }
    },
    thyroid: {
        answers: {
            bowelMovements: 'Regular',
            acidity: 'No',
            heatIntolerance: 'No',
            weightIssues: 'Weight Gain',
            coldSensitivity: 'Yes',
            appetite: 'Low',
            jointStiffness: 'Yes',
            facialSwelling: 'Sometimes',
            anxiety: 'No',
            sleepPattern: '7–8 hrs',
            drySkinHair: 'Normal',
            nails: 'Healthy',
            sweating: 'Normal',
            voiceHoarseness: 'Absent',
            pastIllness: ['Diabetes'],
            pastIllnessOther: '',
            familyHistory: ['None'],
            thyroidProfileChecked: 'No',
            hairThinning: 'No',
            heartRate: 'Normal',
            neckSwelling: 'No'
        }
    },
    pcos: {
        answers: {
            lastCycleDate: new Date('2024-01-01'),
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
    }
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = TEST_TOKEN) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message, 
            status: error.response?.status 
        };
    }
};

// Test functions
const testMenopauseAssessment = async () => {
    console.log('\n=== TESTING MENOPAUSE ASSESSMENT API ===');
    
    // 1. Get questions
    console.log('\n1. Getting menopause assessment questions...');
    const questionsResponse = await makeRequest('GET', '/menopause-assessment/questions');
    if (questionsResponse.success) {
        console.log('✅ Questions retrieved successfully');
        console.log(`   Found ${questionsResponse.data.data.questions?.length || 0} questions`);
    } else {
        console.log('❌ Failed to get questions:', questionsResponse.error);
    }
    
    // 2. Calculate risk level (preview)
    console.log('\n2. Calculating risk level preview...');
    const riskPreviewResponse = await makeRequest('POST', '/menopause-assessment/calculate-risk', {
        answers: testData.menopause.answers
    });
    if (riskPreviewResponse.success) {
        console.log('✅ Risk calculation successful');
        console.log(`   Total Score: ${riskPreviewResponse.data.data.totalScore}`);
        console.log(`   Average Score: ${riskPreviewResponse.data.data.averageScore}`);
        console.log(`   Risk Level: ${riskPreviewResponse.data.data.riskLevel}`);
    } else {
        console.log('❌ Failed to calculate risk:', riskPreviewResponse.error);
    }
    
    // 3. Create assessment
    console.log('\n3. Creating menopause assessment...');
    const createResponse = await makeRequest('POST', '/menopause-assessment', {
        answers: testData.menopause.answers
    });
    if (createResponse.success) {
        console.log('✅ Assessment created successfully');
        console.log(`   Assessment ID: ${createResponse.data.data.assessment._id}`);
        console.log(`   Risk Level: ${createResponse.data.data.assessment.riskLevel}`);
        console.log(`   Total Score: ${createResponse.data.data.assessment.totalScore}`);
        
        // 4. Get latest assessment
        console.log('\n4. Getting latest assessment...');
        const latestResponse = await makeRequest('GET', '/menopause-assessment/latest');
        if (latestResponse.success) {
            console.log('✅ Latest assessment retrieved');
            console.log(`   Risk Level: ${latestResponse.data.data.assessment.riskLevel}`);
        } else {
            console.log('❌ Failed to get latest assessment:', latestResponse.error);
        }
        
        // 5. Get assessment history
        console.log('\n5. Getting assessment history...');
        const historyResponse = await makeRequest('GET', '/menopause-assessment/history');
        if (historyResponse.success) {
            console.log('✅ Assessment history retrieved');
            console.log(`   Total assessments: ${historyResponse.data.data.assessments?.length || 0}`);
        } else {
            console.log('❌ Failed to get history:', historyResponse.error);
        }
        
        // 6. Get assessment stats
        console.log('\n6. Getting assessment statistics...');
        const statsResponse = await makeRequest('GET', '/menopause-assessment/stats');
        if (statsResponse.success) {
            console.log('✅ Statistics retrieved');
            console.log(`   Total assessments: ${statsResponse.data.data.stats?.totalAssessments || 0}`);
        } else {
            console.log('❌ Failed to get stats:', statsResponse.error);
        }
        
        return createResponse.data.data.assessment._id;
    } else {
        console.log('❌ Failed to create assessment:', createResponse.error);
        return null;
    }
};

const testThyroidAssessment = async () => {
    console.log('\n=== TESTING THYROID ASSESSMENT API ===');
    
    // 1. Get questions
    console.log('\n1. Getting thyroid assessment questions...');
    const questionsResponse = await makeRequest('GET', '/thyroid-assessment/questions');
    if (questionsResponse.success) {
        console.log('✅ Questions retrieved successfully');
        console.log(`   Found ${questionsResponse.data.data.questions?.length || 0} questions`);
    } else {
        console.log('❌ Failed to get questions:', questionsResponse.error);
    }
    
    // 2. Calculate risk level (preview)
    console.log('\n2. Calculating risk level preview...');
    const riskPreviewResponse = await makeRequest('POST', '/thyroid-assessment/calculate-risk', {
        answers: testData.thyroid.answers
    });
    if (riskPreviewResponse.success) {
        console.log('✅ Risk calculation successful');
        console.log(`   Total Score: ${riskPreviewResponse.data.data.totalScore}`);
        console.log(`   Risk Level: ${riskPreviewResponse.data.data.riskLevel}`);
    } else {
        console.log('❌ Failed to calculate risk:', riskPreviewResponse.error);
    }
    
    // 3. Create assessment
    console.log('\n3. Creating thyroid assessment...');
    const createResponse = await makeRequest('POST', '/thyroid-assessment', {
        answers: testData.thyroid.answers
    });
    if (createResponse.success) {
        console.log('✅ Assessment created successfully');
        console.log(`   Assessment ID: ${createResponse.data.data.assessment._id}`);
        console.log(`   Risk Level: ${createResponse.data.data.assessment.riskLevel}`);
        console.log(`   Total Score: ${createResponse.data.data.assessment.totalScore}`);
        
        // 4. Get latest assessment
        console.log('\n4. Getting latest assessment...');
        const latestResponse = await makeRequest('GET', '/thyroid-assessment/latest');
        if (latestResponse.success) {
            console.log('✅ Latest assessment retrieved');
            console.log(`   Risk Level: ${latestResponse.data.data.assessment.riskLevel}`);
        } else {
            console.log('❌ Failed to get latest assessment:', latestResponse.error);
        }
        
        // 5. Get assessment history
        console.log('\n5. Getting assessment history...');
        const historyResponse = await makeRequest('GET', '/thyroid-assessment/history');
        if (historyResponse.success) {
            console.log('✅ Assessment history retrieved');
            console.log(`   Total assessments: ${historyResponse.data.data.assessments?.length || 0}`);
        } else {
            console.log('❌ Failed to get history:', historyResponse.error);
        }
        
        // 6. Get assessment stats
        console.log('\n6. Getting assessment statistics...');
        const statsResponse = await makeRequest('GET', '/thyroid-assessment/stats');
        if (statsResponse.success) {
            console.log('✅ Statistics retrieved');
            console.log(`   Total assessments: ${statsResponse.data.data.stats?.totalAssessments || 0}`);
        } else {
            console.log('❌ Failed to get stats:', statsResponse.error);
        }
        
        return createResponse.data.data.assessment._id;
    } else {
        console.log('❌ Failed to create assessment:', createResponse.error);
        return null;
    }
};

const testPcosAssessment = async () => {
    console.log('\n=== TESTING PCOS ASSESSMENT API ===');
    
    // 1. Get questions
    console.log('\n1. Getting PCOS assessment questions...');
    const questionsResponse = await makeRequest('GET', '/pcos-assessment/questions');
    if (questionsResponse.success) {
        console.log('✅ Questions retrieved successfully');
        console.log(`   Found ${questionsResponse.data.data.questions?.length || 0} questions`);
    } else {
        console.log('❌ Failed to get questions:', questionsResponse.error);
    }
    
    // 2. Calculate risk level (preview)
    console.log('\n2. Calculating risk level preview...');
    const riskPreviewResponse = await makeRequest('POST', '/pcos-assessment/calculate-risk', {
        answers: testData.pcos.answers
    });
    if (riskPreviewResponse.success) {
        console.log('✅ Risk calculation successful');
        console.log(`   Total Score: ${riskPreviewResponse.data.data.totalScore}`);
        console.log(`   Risk Level: ${riskPreviewResponse.data.data.riskLevel}`);
    } else {
        console.log('❌ Failed to calculate risk:', riskPreviewResponse.error);
    }
    
    // 3. Create assessment
    console.log('\n3. Creating PCOS assessment...');
    const createResponse = await makeRequest('POST', '/pcos-assessment', {
        answers: testData.pcos.answers
    });
    if (createResponse.success) {
        console.log('✅ Assessment created successfully');
        console.log(`   Assessment ID: ${createResponse.data.data.assessment._id}`);
        console.log(`   Risk Level: ${createResponse.data.data.assessment.riskLevel}`);
        console.log(`   Total Score: ${createResponse.data.data.assessment.totalScore}`);
        
        // 4. Get latest assessment
        console.log('\n4. Getting latest assessment...');
        const latestResponse = await makeRequest('GET', '/pcos-assessment/latest');
        if (latestResponse.success) {
            console.log('✅ Latest assessment retrieved');
            console.log(`   Risk Level: ${latestResponse.data.data.assessment.riskLevel}`);
        } else {
            console.log('❌ Failed to get latest assessment:', latestResponse.error);
        }
        
        // 5. Get assessment history
        console.log('\n5. Getting assessment history...');
        const historyResponse = await makeRequest('GET', '/pcos-assessment/history');
        if (historyResponse.success) {
            console.log('✅ Assessment history retrieved');
            console.log(`   Total assessments: ${historyResponse.data.data.assessments?.length || 0}`);
        } else {
            console.log('❌ Failed to get history:', historyResponse.error);
        }
        
        // 6. Get assessment stats
        console.log('\n6. Getting assessment statistics...');
        const statsResponse = await makeRequest('GET', '/pcos-assessment/stats');
        if (statsResponse.success) {
            console.log('✅ Statistics retrieved');
            console.log(`   Total assessments: ${statsResponse.data.data.stats?.totalAssessments || 0}`);
        } else {
            console.log('❌ Failed to get stats:', statsResponse.error);
        }
        
        return createResponse.data.data.assessment._id;
    } else {
        console.log('❌ Failed to create assessment:', createResponse.error);
        return null;
    }
};

// Test error cases
const testErrorCases = async () => {
    console.log('\n=== TESTING ERROR CASES ===');
    
    // Test with missing required fields
    console.log('\n1. Testing missing required fields...');
    const missingFieldsResponse = await makeRequest('POST', '/menopause-assessment', {
        answers: {
            irregularPeriods: 'Sometimes'
            // Missing other required fields
        }
    });
    if (!missingFieldsResponse.success && missingFieldsResponse.status === 400) {
        console.log('✅ Correctly rejected missing fields');
    } else {
        console.log('❌ Should have rejected missing fields');
    }
    
    // Test with invalid answer values
    console.log('\n2. Testing invalid answer values...');
    const invalidValuesResponse = await makeRequest('POST', '/menopause-assessment', {
        answers: {
            irregularPeriods: 'Invalid Value',
            fatigue: 'Often tired',
            weightChanges: 'Slight weight gain',
            sleepQuality: 'Poor sleep',
            moodSwings: 'Frequently'
        }
    });
    if (!invalidValuesResponse.success) {
        console.log('✅ Correctly rejected invalid values');
    } else {
        console.log('❌ Should have rejected invalid values');
    }
    
    // Test without authentication
    console.log('\n3. Testing without authentication...');
    const noAuthResponse = await makeRequest('POST', '/menopause-assessment', {
        answers: testData.menopause.answers
    }, null);
    if (!noAuthResponse.success && noAuthResponse.status === 401) {
        console.log('✅ Correctly rejected unauthenticated request');
    } else {
        console.log('❌ Should have rejected unauthenticated request');
    }
};

// Main test runner
const runTests = async () => {
    console.log('🚀 Starting Assessment API Tests...');
    console.log(`📋 Testing with User ID: ${USER_ID}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    
    try {
        // Test all assessment types
        const menopauseId = await testMenopauseAssessment();
        const thyroidId = await testThyroidAssessment();
        const pcosId = await testPcosAssessment();
        
        // Test error cases
        await testErrorCases();
        
        console.log('\n=== TEST SUMMARY ===');
        console.log(`✅ Menopause Assessment: ${menopauseId ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ Thyroid Assessment: ${thyroidId ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ PCOS Assessment: ${pcosId ? 'PASSED' : 'FAILED'}`);
        
        console.log('\n🎉 All tests completed!');
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
    }
};

// Always run when file is executed
runTests();

export {
    testMenopauseAssessment,
    testThyroidAssessment,
    testPcosAssessment,
    testErrorCases,
    runTests
};
