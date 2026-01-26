# Time all the time fields should be updated before running the script
#!/usr/bin/env bash

echo "=== Starting Event Seeding Script ==="
echo ""

# 1. Authenticate and get access token
echo "Step 1: Authenticating..."
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","passwd":"dummypassword123"}')

TOKEN=$(echo "$LOGIN_RESP" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to authenticate. Response: $LOGIN_RESP"
  exit 1
fi

echo "✓ Authentication successful"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 2. Create Events
echo "Step 2: Creating 6 events..."
echo ""

# Event 1: Code Sprint (Technical / Solo)
echo "Creating Event 1/6: Code Sprint (Technical/Solo)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Sprint",
    "description": "High-intensity competitive programming challenge where participants solve algorithmic problems under time pressure. Test your problem-solving skills and coding efficiency.",
    "participation_type": "solo",
    "event_type": "technical",
    "max_allowed": 150,
    "min_team_size": 1,
    "max_team_size": 1,
    "venue": "Computer Lab A - Block 3",
    "registration_start": "2026-01-26T07:35:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Qualifier Round",
        "round_description": "Basic algorithmic challenges to filter top performers",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T05:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Participants must solve at least 3 problems to qualify"},
          {"rule_no": 2, "rule_description": "Use of internet or external resources is strictly prohibited"},
          {"rule_no": 3, "rule_description": "Code plagiarism will result in immediate disqualification"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Advanced Challenge",
        "round_description": "Complex data structure and algorithm problems",
        "start_time": "2026-02-25T06:00:00.000Z",
        "end_time": "2026-02-25T08:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 50 participants from Round 1 advance to this round"},
          {"rule_no": 2, "rule_description": "Solutions must pass all test cases for full marks"},
          {"rule_no": 3, "rule_description": "Time and space complexity will be evaluated"}
        ]
      },
      {
        "round_no": 3,
        "round_name": "Final Showdown",
        "round_description": "Expert-level competitive programming challenges",
        "start_time": "2026-02-25T08:00:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 20 participants compete in the finals"},
          {"rule_no": 2, "rule_description": "Partial scoring available for incomplete solutions"},
          {"rule_no": 3, "rule_description": "Winners decided by total score and submission time"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 15000},
      {"position": 2, "reward_value": 10000},
      {"position": 3, "reward_value": 5000}
    ],
    "crew": {
      "organizers": [{"email": "organizer1@example.com"}],
      "volunteers": [{"email": "volunteer1@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 2: Innovate Hack (Technical / Team)
echo "Creating Event 2/6: Innovate Hack (Technical/Team)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Innovate Hack",
    "description": "24-hour hackathon focused on building innovative tech solutions for real-world problems. Collaborate with your team to create impactful prototypes.",
    "participation_type": "team",
    "event_type": "technical",
    "max_allowed": 50,
    "min_team_size": 2,
    "max_team_size": 4,
    "venue": "Innovation Hub - Main Campus",
    "registration_start": "2026-01-26T07:35:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Ideation & Pitching",
        "round_description": "Present your innovative idea and technical approach to judges",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T05:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Teams must present a 5-minute pitch deck"},
          {"rule_no": 2, "rule_description": "Solution must address a real-world problem"},
          {"rule_no": 3, "rule_description": "Technical feasibility will be evaluated"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Development Sprint",
        "round_description": "Build your prototype with core functionality",
        "start_time": "2026-02-25T06:00:00.000Z",
        "end_time": "2026-02-25T08:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 20 teams from Round 1 advance"},
          {"rule_no": 2, "rule_description": "Code must be pushed to GitHub repository"},
          {"rule_no": 3, "rule_description": "All team members must contribute to codebase"}
        ]
      },
      {
        "round_no": 3,
        "round_name": "Final Demo",
        "round_description": "Demonstrate working prototype to judges",
        "start_time": "2026-02-25T08:00:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Live demonstration of working prototype required"},
          {"rule_no": 2, "rule_description": "Innovation and impact will be key criteria"},
          {"rule_no": 3, "rule_description": "Q&A session with judges mandatory"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 50000},
      {"position": 2, "reward_value": 30000},
      {"position": 3, "reward_value": 20000}
    ],
    "crew": {
      "organizers": [{"email": "organizer2@example.com"}],
      "volunteers": [{"email": "volunteer2@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 3: Debate Championship (Non-technical / Solo)
echo "Creating Event 3/6: Debate Championship (Non-technical/Solo)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Debate Championship",
    "description": "Showcase your oratory skills and critical thinking in this prestigious debate competition. Engage in intellectual discourse on contemporary topics.",
    "participation_type": "solo",
    "event_type": "non-technical",
    "max_allowed": 80,
    "min_team_size": 1,
    "max_team_size": 1,
    "venue": "Auditorium - Main Block",
    "registration_start": "2026-01-26T07:35:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Preliminary Round",
        "round_description": "Extempore speaking on assigned topics",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T05:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Each participant gets 3 minutes preparation time"},
          {"rule_no": 2, "rule_description": "Speaking time is strictly limited to 5 minutes"},
          {"rule_no": 3, "rule_description": "Use of notes or electronic devices is prohibited"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Semi-Finals",
        "round_description": "Structured debates on contemporary issues",
        "start_time": "2026-02-25T06:00:00.000Z",
        "end_time": "2026-02-25T08:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 30 participants advance to semi-finals"},
          {"rule_no": 2, "rule_description": "Topics will be announced 10 minutes before debate"},
          {"rule_no": 3, "rule_description": "Participants must argue both FOR and AGAINST positions"}
        ]
      },
      {
        "round_no": 3,
        "round_name": "Grand Finale",
        "round_description": "Championship debate with audience participation",
        "start_time": "2026-02-25T08:00:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 6 finalists compete in final round"},
          {"rule_no": 2, "rule_description": "Audience questions allowed during rebuttal"},
          {"rule_no": 3, "rule_description": "Judges score on content, delivery, and rebuttal"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 12000},
      {"position": 2, "reward_value": 8000},
      {"position": 3, "reward_value": 5000}
    ],
    "crew": {
      "organizers": [{"email": "organizer3@example.com"}],
      "volunteers": [{"email": "volunteer3@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 4: Treasure Hunt (Non-technical / Team)
echo "Creating Event 4/6: Treasure Hunt (Non-technical/Team)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Treasure Hunt",
    "description": "An exciting campus-wide treasure hunt combining physical challenges, puzzles, and teamwork. Navigate through cryptic clues to discover the ultimate treasure.",
    "participation_type": "team",
    "event_type": "non-technical",
    "max_allowed": 40,
    "min_team_size": 3,
    "max_team_size": 5,
    "venue": "Entire Campus Area",
    "registration_start": "2026-01-26T07:35:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Clue Quest",
        "round_description": "Solve riddles and cryptic clues to unlock locations",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T05:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "All team members must stay together throughout the hunt"},
          {"rule_no": 2, "rule_description": "No use of vehicles or external help allowed"},
          {"rule_no": 3, "rule_description": "Teams must collect checkpoints in designated order"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Challenge Stations",
        "round_description": "Complete physical and mental challenges at each location",
        "start_time": "2026-02-25T06:00:00.000Z",
        "end_time": "2026-02-25T08:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 15 teams from Round 1 proceed"},
          {"rule_no": 2, "rule_description": "Each challenge must be completed to earn the next clue"},
          {"rule_no": 3, "rule_description": "Time penalties for skipped challenges"}
        ]
      },
      {
        "round_no": 3,
        "round_name": "Final Hunt",
        "round_description": "Race to decode the master clue and find the treasure",
        "start_time": "2026-02-25T08:00:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 8 teams compete in final treasure hunt"},
          {"rule_no": 2, "rule_description": "First team to reach treasure location wins"},
          {"rule_no": 3, "rule_description": "Bonus points for creativity in problem-solving"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 25000},
      {"position": 2, "reward_value": 15000},
      {"position": 3, "reward_value": 10000}
    ],
    "crew": {
      "organizers": [{"email": "organizer4@example.com"}],
      "volunteers": [{"email": "volunteer4@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 5: Grand Hackathon (Flagship / Team)
echo "Creating Event 5/6: Grand Hackathon (Flagship/Team)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grand Hackathon",
    "description": "The premier flagship event featuring the biggest hackathon of the year. Build cutting-edge solutions with industry mentorship and compete for massive prizes.",
    "participation_type": "team",
    "event_type": "flagship",
    "max_allowed": 100,
    "min_team_size": 2,
    "max_team_size": 5,
    "venue": "Convention Center - Grand Arena",
    "registration_start": "2026-01-26T07:35:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Problem Statement Selection",
        "round_description": "Choose from industry-sponsored problem statements and submit proposal",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T05:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Teams select one problem statement from available tracks"},
          {"rule_no": 2, "rule_description": "Submit detailed technical proposal and architecture"},
          {"rule_no": 3, "rule_description": "Judging panel selects top teams for development phase"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Intensive Development",
        "round_description": "Build your solution with mentor guidance",
        "start_time": "2026-02-25T06:00:00.000Z",
        "end_time": "2026-02-25T08:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 40 teams receive mentorship from industry experts"},
          {"rule_no": 2, "rule_description": "Regular progress checkpoints mandatory"},
          {"rule_no": 3, "rule_description": "Must use designated tech stack for your track"}
        ]
      },
      {
        "round_no": 3,
        "round_name": "Championship Demo",
        "round_description": "Present final solution to judges and industry leaders",
        "start_time": "2026-02-25T08:00:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 10 teams present to panel of judges"},
          {"rule_no": 2, "rule_description": "15-minute demo followed by 10-minute Q&A"},
          {"rule_no": 3, "rule_description": "Evaluation based on innovation, implementation, and impact"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 100000},
      {"position": 2, "reward_value": 60000},
      {"position": 3, "reward_value": 40000}
    ],
    "crew": {
      "organizers": [{"email": "organizer5@example.com"}],
      "volunteers": [{"email": "volunteer5@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 6: Robo Wars (Technical / Team)
echo "Creating Event 6/6: Robo Wars (Technical/Team)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Robo Wars",
    "description": "Ultimate robotics battle arena where custom-built fighting robots clash in intense combat. Design, build, and battle your way to victory in this engineering showcase.",
    "participation_type": "team",
    "event_type": "technical",
    "max_allowed": 30,
    "min_team_size": 3,
    "max_team_size": 6,
    "venue": "Engineering Workshop - Arena Setup",
    "registration_start": "2026-01-26T07:35:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Design Inspection",
        "round_description": "Technical scrutiny of robot specifications and safety check",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T05:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Robot weight must not exceed 15kg"},
          {"rule_no": 2, "rule_description": "All safety measures and kill switches must be functional"},
          {"rule_no": 3, "rule_description": "Detailed design documentation must be submitted"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Qualifying Battles",
        "round_description": "Initial combat rounds with multiple opponents",
        "start_time": "2026-02-25T06:00:00.000Z",
        "end_time": "2026-02-25T08:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "3-minute battle duration per match"},
          {"rule_no": 2, "rule_description": "Points awarded for aggression, control, and damage"},
          {"rule_no": 3, "rule_description": "Immobilized robots have 30 seconds to recover"}
        ]
      },
      {
        "round_no": 3,
        "round_name": "Championship Arena",
        "round_description": "Knockout tournament for ultimate robo warrior title",
        "start_time": "2026-02-25T08:00:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 8 robots compete in elimination bracket"},
          {"rule_no": 2, "rule_description": "Battle duration extended to 5 minutes for finals"},
          {"rule_no": 3, "rule_description": "Winner determined by knockout or judges decision"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 40000},
      {"position": 2, "reward_value": 25000},
      {"position": 3, "reward_value": 15000}
    ],
    "crew": {
      "organizers": [{"email": "organizer6@example.com"}],
      "volunteers": [{"email": "volunteer6@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 7: Web Design Battle (Technical / Solo) - 2 Rounds
echo "Creating Event 7/12: Web Design Battle (Technical/Solo)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Web Design Battle",
    "description": "Creative web design competition where participants showcase their UI/UX skills by building stunning responsive websites. Push your design boundaries and create visually impressive interfaces.",
    "participation_type": "solo",
    "event_type": "technical",
    "max_allowed": 100,
    "min_team_size": 1,
    "max_team_size": 1,
    "venue": "Design Studio - Block 2",
    "registration_start": "2026-01-26T07:40:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Design Sprint",
        "round_description": "Create a landing page based on given theme",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T06:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Must be responsive and mobile-friendly"},
          {"rule_no": 2, "rule_description": "Only HTML, CSS, and vanilla JavaScript allowed"},
          {"rule_no": 3, "rule_description": "Design must follow accessibility guidelines"},
          {"rule_no": 4, "rule_description": "Submissions must be deployed and live"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Final Showcase",
        "round_description": "Present your design to judges and defend choices",
        "start_time": "2026-02-25T07:00:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 20 designers advance to finals"},
          {"rule_no": 2, "rule_description": "5-minute presentation followed by Q&A"},
          {"rule_no": 3, "rule_description": "Must explain design decisions and user experience"},
          {"rule_no": 4, "rule_description": "Judged on creativity, usability, and technical execution"},
          {"rule_no": 5, "rule_description": "Cross-browser compatibility will be tested"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 12000},
      {"position": 2, "reward_value": 7000},
      {"position": 3, "reward_value": 4000}
    ],
    "crew": {
      "organizers": [{"email": "organizer7@example.com"}],
      "volunteers": [{"email": "volunteer7@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 8: Quiz Masters (Non-technical / Team) - 4 Rounds
echo "Creating Event 8/12: Quiz Masters (Non-technical/Team)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quiz Masters",
    "description": "Ultimate general knowledge quiz competition covering diverse topics from history to pop culture. Test your teams collective wisdom and quick thinking abilities.",
    "participation_type": "team",
    "event_type": "non-technical",
    "max_allowed": 60,
    "min_team_size": 2,
    "max_team_size": 3,
    "venue": "Seminar Hall - Academic Block",
    "registration_start": "2026-01-26T07:40:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Written Preliminary",
        "round_description": "Multiple choice questions across various categories",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T04:45:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "50 questions covering general knowledge"},
          {"rule_no": 2, "rule_description": "No use of mobile phones or external resources"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Buzzer Round",
        "round_description": "Fast-paced rapid-fire questions with buzzers",
        "start_time": "2026-02-25T05:00:00.000Z",
        "end_time": "2026-02-25T06:15:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 30 teams qualify for buzzer round"},
          {"rule_no": 2, "rule_description": "First team to buzz gets to answer"},
          {"rule_no": 3, "rule_description": "Wrong answers result in negative marking"}
        ]
      },
      {
        "round_no": 3,
        "round_name": "Audio-Visual Round",
        "round_description": "Identify songs, movies, personalities from clips",
        "start_time": "2026-02-25T06:30:00.000Z",
        "end_time": "2026-02-25T07:45:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 15 teams proceed to multimedia round"},
          {"rule_no": 2, "rule_description": "Questions based on audio and video clues"},
          {"rule_no": 3, "rule_description": "Team discussion allowed for 30 seconds"},
          {"rule_no": 4, "rule_description": "Partial answers receive partial credit"}
        ]
      },
      {
        "round_no": 4,
        "round_name": "Grand Finale",
        "round_description": "Championship round with live audience",
        "start_time": "2026-02-25T08:00:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 6 teams battle in the finals"},
          {"rule_no": 2, "rule_description": "Mix of all question formats"},
          {"rule_no": 3, "rule_description": "Audience can participate in bonus rounds"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 18000},
      {"position": 2, "reward_value": 12000},
      {"position": 3, "reward_value": 7000}
    ],
    "crew": {
      "organizers": [{"email": "organizer8@example.com"}],
      "volunteers": [{"email": "volunteer8@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 9: AI Innovation Challenge (Flagship / Team) - 3 Rounds
echo "Creating Event 9/12: AI Innovation Challenge (Flagship/Team)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Innovation Challenge",
    "description": "Premier flagship AI/ML competition where teams build intelligent solutions using cutting-edge machine learning and artificial intelligence technologies. Solve complex problems with AI-powered innovations.",
    "participation_type": "team",
    "event_type": "flagship",
    "max_allowed": 75,
    "min_team_size": 3,
    "max_team_size": 5,
    "venue": "AI Research Lab - Tech Park",
    "registration_start": "2026-01-26T07:40:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Problem Analysis",
        "round_description": "Analyze AI problem statements and propose solutions",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T05:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Choose from ML, NLP, Computer Vision, or Reinforcement Learning tracks"},
          {"rule_no": 2, "rule_description": "Submit technical proposal with model architecture"},
          {"rule_no": 3, "rule_description": "Must include data preprocessing strategy"},
          {"rule_no": 4, "rule_description": "Evaluation metrics must be defined"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Model Development",
        "round_description": "Train and optimize your AI models",
        "start_time": "2026-02-25T06:00:00.000Z",
        "end_time": "2026-02-25T08:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 30 teams get access to GPU resources"},
          {"rule_no": 2, "rule_description": "Models must be trained on provided datasets"},
          {"rule_no": 3, "rule_description": "Code must be version controlled on GitHub"}
        ]
      },
      {
        "round_no": 3,
        "round_name": "Live Demo & Evaluation",
        "round_description": "Present AI solution with live inference demonstrations",
        "start_time": "2026-02-25T08:00:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 12 teams present to industry experts"},
          {"rule_no": 2, "rule_description": "Live demo with real-time predictions required"},
          {"rule_no": 3, "rule_description": "Model performance benchmarks will be tested"},
          {"rule_no": 4, "rule_description": "Explainability and interpretability evaluated"},
          {"rule_no": 5, "rule_description": "Deployment strategy must be discussed"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 80000},
      {"position": 2, "reward_value": 50000},
      {"position": 3, "reward_value": 30000}
    ],
    "crew": {
      "organizers": [{"email": "organizer9@example.com"}],
      "volunteers": [{"email": "volunteer9@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 10: Photography Contest (Non-technical / Solo) - 2 Rounds
echo "Creating Event 10/12: Photography Contest (Non-technical/Solo)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Photography Contest",
    "description": "Capture the world through your lens in this creative photography competition. Showcase your artistic vision and technical photography skills across various themes and subjects.",
    "participation_type": "solo",
    "event_type": "non-technical",
    "max_allowed": 120,
    "min_team_size": 1,
    "max_team_size": 1,
    "venue": "Art Gallery - Cultural Center",
    "registration_start": "2026-01-26T07:40:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Portfolio Submission",
        "round_description": "Submit your best photography work across themes",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T06:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Submit 5 photos across different categories"},
          {"rule_no": 2, "rule_description": "Minimal post-processing allowed"},
          {"rule_no": 3, "rule_description": "Original work only - plagiarism will be disqualified"},
          {"rule_no": 4, "rule_description": "EXIF data must be intact"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "On-Spot Challenge",
        "round_description": "Capture images based on surprise theme",
        "start_time": "2026-02-25T06:30:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 40 photographers advance to on-spot round"},
          {"rule_no": 2, "rule_description": "Theme announced at start of round"},
          {"rule_no": 3, "rule_description": "90 minutes to capture and submit 3 photos"},
          {"rule_no": 4, "rule_description": "Any camera or smartphone allowed"},
          {"rule_no": 5, "rule_description": "Photos must be taken within campus boundaries"},
          {"rule_no": 6, "rule_description": "Judged on composition, creativity, and technical quality"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 10000},
      {"position": 2, "reward_value": 6000},
      {"position": 3, "reward_value": 4000}
    ],
    "crew": {
      "organizers": [{"email": "organizer10@example.com"}],
      "volunteers": [{"email": "volunteer10@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 11: Cyber Security CTF (Technical / Team) - 4 Rounds
echo "Creating Event 11/12: Cyber Security CTF (Technical/Team)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cyber Security CTF",
    "description": "Capture The Flag competition testing your cybersecurity skills across web exploitation, cryptography, reverse engineering, and network security. Hack, decrypt, and defend your way to victory.",
    "participation_type": "team",
    "event_type": "technical",
    "max_allowed": 45,
    "min_team_size": 2,
    "max_team_size": 4,
    "venue": "Cyber Lab - Security Wing",
    "registration_start": "2026-01-26T07:40:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Jeopardy Style CTF",
        "round_description": "Solve challenges across multiple security domains",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T05:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Challenges in web, crypto, forensics, and binary exploitation"},
          {"rule_no": 2, "rule_description": "Each flag captured earns points"},
          {"rule_no": 3, "rule_description": "Hints available at cost of points"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Web Exploitation",
        "round_description": "Exploit vulnerabilities in web applications",
        "start_time": "2026-02-25T05:15:00.000Z",
        "end_time": "2026-02-25T06:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 25 teams advance to specialized rounds"},
          {"rule_no": 2, "rule_description": "Find and exploit SQL injection, XSS, CSRF vulnerabilities"},
          {"rule_no": 3, "rule_description": "Automated scanning tools prohibited"}
        ]
      },
      {
        "round_no": 3,
        "round_name": "Cryptography Challenge",
        "round_description": "Break encryption and decode secret messages",
        "start_time": "2026-02-25T06:45:00.000Z",
        "end_time": "2026-02-25T08:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Decrypt various cipher algorithms"},
          {"rule_no": 2, "rule_description": "Classical and modern cryptography challenges"},
          {"rule_no": 3, "rule_description": "Code breaking tools allowed"}
        ]
      },
      {
        "round_no": 4,
        "round_name": "Attack-Defense",
        "round_description": "Protect your server while attacking opponents",
        "start_time": "2026-02-25T08:15:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 10 teams compete in attack-defense format"},
          {"rule_no": 2, "rule_description": "Each team gets a vulnerable server to defend"},
          {"rule_no": 3, "rule_description": "Points for attacking others and defending your own"},
          {"rule_no": 4, "rule_description": "Services must remain functional"},
          {"rule_no": 5, "rule_description": "DoS attacks strictly prohibited"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 35000},
      {"position": 2, "reward_value": 22000},
      {"position": 3, "reward_value": 13000}
    ],
    "crew": {
      "organizers": [{"email": "organizer11@example.com"}],
      "volunteers": [{"email": "volunteer11@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

# Event 12: Music Band Competition (Non-technical / Team) - 3 Rounds
echo "Creating Event 12/12: Music Band Competition (Non-technical/Team)..."
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Music Band Competition",
    "description": "Battle of the bands showcasing musical talent across genres. Bring your band together to perform original compositions and popular covers. Rock the stage and win hearts.",
    "participation_type": "team",
    "event_type": "non-technical",
    "max_allowed": 25,
    "min_team_size": 3,
    "max_team_size": 7,
    "venue": "Open Air Theatre - Main Campus",
    "registration_start": "2026-01-26T07:40:00.000Z",
    "registration_end": "2026-02-24T18:29:00.000Z",
    "start_time": "2026-02-25T03:30:00.000Z",
    "end_time": "2026-02-25T09:30:00.000Z",
    "rounds": [
      {
        "round_no": 1,
        "round_name": "Audio Submission",
        "round_description": "Submit recorded performance for preliminary screening",
        "start_time": "2026-02-25T03:30:00.000Z",
        "end_time": "2026-02-25T05:00:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Submit one original and one cover song"},
          {"rule_no": 2, "rule_description": "Audio quality and mixing will be evaluated"},
          {"rule_no": 3, "rule_description": "Recordings must be at least studio demo quality"}
        ]
      },
      {
        "round_no": 2,
        "round_name": "Live Acoustics",
        "round_description": "Acoustic performance with minimal amplification",
        "start_time": "2026-02-25T05:30:00.000Z",
        "end_time": "2026-02-25T07:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 12 bands perform live"},
          {"rule_no": 2, "rule_description": "15-minute performance slot per band"},
          {"rule_no": 3, "rule_description": "Acoustic arrangements only"},
          {"rule_no": 4, "rule_description": "Basic sound equipment provided"}
        ]
      },
      {
        "round_no": 3,
        "round_name": "Grand Concert",
        "round_description": "Full electric performance with stage production",
        "start_time": "2026-02-25T08:00:00.000Z",
        "end_time": "2026-02-25T09:30:00.000Z",
        "rules": [
          {"rule_no": 1, "rule_description": "Top 6 bands battle in the finals"},
          {"rule_no": 2, "rule_description": "20-minute performance with full equipment"},
          {"rule_no": 3, "rule_description": "Stage presence and audience engagement scored"},
          {"rule_no": 4, "rule_description": "Mix of original and covers allowed"},
          {"rule_no": 5, "rule_description": "Professional sound and lighting provided"}
        ]
      }
    ],
    "prizes": [
      {"position": 1, "reward_value": 30000},
      {"position": 2, "reward_value": 18000},
      {"position": 3, "reward_value": 12000}
    ],
    "crew": {
      "organizers": [{"email": "organizer12@example.com"}],
      "volunteers": [{"email": "volunteer12@example.com"}]
    }
  }' | grep -o '"message":"[^"]*"' && echo "" || echo "❌ Failed"

echo ""
echo "=== Event Seeding Complete ==="
