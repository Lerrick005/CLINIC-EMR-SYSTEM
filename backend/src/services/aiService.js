const axios = require('axios');

class AIService {
  constructor(db) {
    this.db = db;
    this.useMock = process.env.USE_MOCK_AI === 'true' || !process.env.OPENROUTER_API_KEY;
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = 'openai/gpt-3.5-turbo'; // or 'anthropic/claude-3-haiku', 'openai/gpt-4'
    console.log('AI Mode:', this.useMock ? 'MOCK' : 'REAL (OpenRouter)');
  }

  // ============================================
  // Make OpenRouter API call
  // ============================================
  async callOpenRouter(messages, responseFormat) {
    if (this.useMock) {
      return null; // Will use mock responses
    }

    try {
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: this.model,
        messages: messages,
        temperature: 0.3,
        ...(responseFormat === 'json' && { response_format: { type: 'json_object' } })
      }, {
        headers: {
          'Authorization': 'Bearer ' + this.apiKey,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lerrickai.com',
          'X-Title': 'Lerrick AI Clinic'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API error:', error.response?.data || error.message);
      throw new Error('AI service unavailable');
    }
  }

  // ============================================
  // Extract Medical Information from Voice Text
  // ============================================
  async extractMedicalInfo(text) {
    if (this.useMock) {
      return this.mockExtractMedicalInfo(text);
    }

    const systemPrompt = 'You are a medical assistant for a clinic in Kenya. Extract the following information from the doctor\'s consultation notes: 1. Chief Complaint 2. History of Presenting Illness 3. Symptoms 4. Duration 5. Severity 6. Past Medical History 7. Current Medications 8. Allergies 9. Assessment 10. Plan. Return ONLY a JSON object.';

    const result = await this.callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ], 'json');

    return JSON.parse(result);
  }

  // ============================================
  // Generate SOAP Notes
  // ============================================
  async generateSOAP(medicalData) {
    if (this.useMock) {
      return this.mockGenerateSOAP();
    }

    const prompt = 'Generate SOAP notes based on this medical data:\n\n' +
      'Chief Complaint: ' + (medicalData.chiefComplaint || 'N/A') + '\n' +
      'HPI: ' + (medicalData.history || 'N/A') + '\n' +
      'Symptoms: ' + (medicalData.symptoms || 'N/A') + '\n' +
      'Assessment: ' + (medicalData.assessment || 'N/A') + '\n' +
      'Plan: ' + (medicalData.plan || 'N/A') + '\n\n' +
      'Format as:\nS: (Subjective)\nO: (Objective)\nA: (Assessment)\nP: (Plan)';

    const result = await this.callOpenRouter([
      { role: 'system', content: 'You are a medical assistant. Generate professional SOAP notes.' },
      { role: 'user', content: prompt }
    ]);

    return this.parseSOAP(result);
  }

  parseSOAP(text) {
    const soap = { subjective: '', objective: '', assessment: '', plan: '' };
    const lines = text.split('\n');
    let current = '';
    for (const line of lines) {
      if (line.startsWith('S:')) current = 'subjective';
      else if (line.startsWith('O:')) current = 'objective';
      else if (line.startsWith('A:')) current = 'assessment';
      else if (line.startsWith('P:')) current = 'plan';
      else if (current) soap[current] += line + '\n';
    }
    Object.keys(soap).forEach(k => soap[k] = soap[k].trim());
    return soap;
  }

  // ============================================
  // MOCK RESPONSES (for testing without API key)
  // ============================================
  async mockExtractMedicalInfo(text) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      chiefComplaint: "Headache and fever for 3 days",
      history: "Patient reports persistent headache and fever for 3 days. No known allergies.",
      symptoms: "Headache, fever, body aches",
      duration: "3 days",
      severity: "Moderate",
      pastMedicalHistory: "None reported",
      currentMedications: "None",
      allergies: "None",
      assessment: "Suspected Malaria",
      plan: "Prescribe antimalarial medication, rest, hydration, follow-up in 3 days",
      confidence: 0.85
    };
  }

  async mockGenerateSOAP() {
    return {
      subjective: "Patient reports 3-day history of headache, fever, and body aches.",
      objective: "Vitals to be entered. Patient appears dehydrated.",
      assessment: "Suspected Malaria. Rule out other causes.",
      plan: "1. Artemether-Lumefantrine 20/120mg BD for 3 days\n2. Paracetamol 500mg TDS\n3. Rest and hydration\n4. Follow-up in 3 days"
    };
  }

  async suggestDiagnosis(symptoms, age, gender) {
    if (this.useMock) return this.mockSuggestDiagnosis();
    // ... real implementation
  }

  async suggestTreatment(diagnosis, allergies, age, weight) {
    if (this.useMock) return this.mockSuggestTreatment();
    // ... real implementation
  }

  async checkInteractions(currentMedications, newMedication) {
    if (this.useMock) return this.mockCheckInteractions();
    // ... real implementation
  }

  async generateSummary(consultation) {
    if (this.useMock) return this.mockGenerateSummary();
    // ... real implementation
  }

  async getHealthAdvice(condition, age, language) {
    if (this.useMock) return this.mockGetHealthAdvice();
    // ... real implementation
  }

  // Mock methods
  async mockSuggestDiagnosis() {
    return {
      possible_diagnoses: [
        { name: "Malaria", confidence: "High", explanation: "Fever, headache, body aches typical presentation" },
        { name: "Typhoid", confidence: "Medium", explanation: "Prolonged fever with headache" }
      ],
      differential_diagnosis: ["Dengue Fever", "Viral Infection"],
      suggested_tests: ["Malaria Rapid Test", "Full Blood Count"],
      urgent: false
    };
  }

  async mockSuggestTreatment() {
    return {
      medications: [
        { name: "Artemether-Lumefantrine", dosage: "20/120mg", frequency: "Twice daily", duration: "3 days", route: "Oral" },
        { name: "Paracetamol", dosage: "500mg", frequency: "Three times daily", duration: "As needed", route: "Oral" }
      ],
      lifestyle: ["Increase fluid intake", "Get plenty of rest"],
      follow_up: "Review in 3 days",
      special_instructions: ["Complete full course of medication"]
    };
  }

  async mockCheckInteractions() {
    return {
      interactions: [
        { medication1: "Artemether-Lumefantrine", medication2: "Paracetamol", severity: "Low", description: "Safe to use together." }
      ],
      safe_to_prescribe: true,
      recommendations: ["Monitor for adverse reactions"]
    };
  }

  async mockGenerateSummary() {
    return "Patient presented with 3-day history of headache and fever. Suspected Malaria. Prescribed antimalarial and Paracetamol. Follow-up in 3 days.";
  }

  async mockGetHealthAdvice() {
    return {
      advice: [
        { title: "Malaria Prevention", description: "Sleep under treated mosquito net.", steps: ["Use mosquito net", "Use insect repellent"] }
      ],
      lifestyle_tips: ["Drink plenty of water", "Get adequate rest"],
      when_to_see_doctor: ["If fever doesn't improve in 48 hours", "If symptoms worsen"],
      red_flags: ["Severe headache", "Difficulty breathing", "Confusion"]
    };
  }
}

module.exports = AIService;
