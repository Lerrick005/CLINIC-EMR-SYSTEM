UPDATE consultations 
SET prescriptions = '[
  {
    "id": 123456,
    "name": "Typhoid Medication",
    "dose": "1X2",
    "route": "PO",
    "duration": "7 DAYS",
    "frequency": "QD",
    "instructions": "Take after meals",
    "status": "PENDING",
    "medication": "Typhoid Medication",
    "quantity": 14,
    "history": [
      {
        "status": "PENDING",
        "timestamp": "2026-06-22T16:39:31.031Z",
        "actor": "system",
        "actor_name": "Dr. System",
        "actor_role": "DOCTOR",
        "notes": "Prescribed Typhoid medication"
      }
    ]
  }
]'::jsonb
WHERE id = '33096af1-96dc-4bb3-b00c-75910796384c';
