#!/usr/bin/env bash

API_ENDPOINT="https://app.melinia.in/api/v1/coupons"
FROM_EMAIL="onboard@melinia.dev"
SES_SMTP_HOST="email-smtp.ap-south-1.amazonaws.com"
SES_SMTP_PORT="587"
REGISTER_AT="https://mlndemo.melinia.in/register"
BATCH_SIZE=12

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS] <csv_file>

Options:
    -t, --token <token>        API Bearer token (required)
    -u, --username <username>  SES SMTP username (required)
    -p, --password <password>  SES SMTP password (required)
    -h, --help                 Show this help message

Example:
    $0 -t "your_token" -u "AKIAXXXX" -p "your_pass" maillist.csv

CSV Format:
    college_mail,name,roll_no
    email@example.com,JOHN DOE,

EOF
    exit 1
}

# Parse command line arguments
BEARER_TOKEN=""
SES_SMTP_USERNAME=""
SES_SMTP_PASSWORD=""
CSV_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--token)
            BEARER_TOKEN="$2"
            shift 2
            ;;
        -u|--username)
            SES_SMTP_USERNAME="$2"
            shift 2
            ;;
        -p|--password)
            SES_SMTP_PASSWORD="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            if [[ -z "$CSV_FILE" ]]; then
                CSV_FILE="$1"
            else
                echo -e "${RED}Error: Unknown option: $1${NC}"
                usage
            fi
            shift
            ;;
    esac
done

# Validate required arguments
if [[ -z "$BEARER_TOKEN" ]] || [[ -z "$SES_SMTP_USERNAME" ]] || [[ -z "$SES_SMTP_PASSWORD" ]] || [[ -z "$CSV_FILE" ]]; then
    echo -e "${RED}Error: Missing required arguments${NC}\n"
    usage
fi

# Check if CSV file exists
if [[ ! -f "$CSV_FILE" ]]; then
    echo -e "${RED}Error: File '$CSV_FILE' not found${NC}"
    exit 1
fi

# Check if file is readable
if [[ ! -r "$CSV_FILE" ]]; then
    echo -e "${RED}Error: Cannot read '$CSV_FILE'${NC}"
    exit 1
fi

# Function to capitalize name
capitalize_name() {
    echo "$1" | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1'
}

# Function to generate random code
generate_random_code() {
    local letters=$(cat /dev/urandom | tr -dc 'A-Z' | fold -w 3 | head -n 1)
    local digits=$(cat /dev/urandom | tr -dc '0-9' | fold -w 3 | head -n 1)
    echo "${letters}${digits}" | fold -w1 | shuf | tr -d '\n'
}

# Function to generate coupon code
generate_coupon_code() {
    echo "MLNC$(generate_random_code)"
}

# Function to create coupon via API
create_coupon() {
    local coupon_code=$1
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_ENDPOINT" \
        -H "Authorization: Bearer $BEARER_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"code\": \"$coupon_code\"}" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    
    if [[ "$http_code" -eq 200 ]] || [[ "$http_code" -eq 201 ]]; then
        return 0
    else
        echo -e "${RED}API Error (HTTP $http_code)${NC}" >&2
        return 1
    fi
}

# Function to send email
send_email() {
    local to_email=$1
    local username=$2
    local coupon_code=$3
    local capitalized_name=$(capitalize_name "$username")
    local email_file=$(mktemp)
    
    cat > "$email_file" << EOF
From: Melinia'26 <$FROM_EMAIL>
To: $to_email
Subject: Your Registration Coupon for Melinia'26
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary-$(date +%s)"

--boundary-$(date +%s)
Content-Type: text/plain; charset="UTF-8"

Hello $capitalized_name,

Your Registration Coupon for Melinia'26

Apply the code below to register for Melinia'26.

Your Coupon Code: $coupon_code

Register here: $REGISTER_AT 

This is an automated message, please do not reply to this email.
Need assistance? Contact us at helpdesk@melinia.in

Melinia'26 Dev Team

--boundary-$(date +%s)
Content-Type: text/html; charset="UTF-8"

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Coupon</title>
    <style>
        /* --- CSS Reset & Base Styles --- */
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 0;
            background-color: #09090b;
            font-family: system-ui, -apple-system, sans-serif;
            color: #f4f4f5;
            -webkit-font-smoothing: antialiased;
        }

        /* --- Animations --- */
        @keyframes borderFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .running-border {
            background: linear-gradient(90deg, #A07CFE, #8FB5FE, #8FEBFE, #A07CFE);
            background-size: 300% 100%;
            animation: borderFlow 4s linear infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }

        .coupon-box {
            cursor: default; 
            transition: all 0.3s ease;
        }

        /* --- Responsive Media Queries --- */
        @media screen and (max-width: 480px) {
            .container { padding: 20px 10px !important; }
            .content { padding: 30px 20px !important; }
            
            /* Coupon Box Fixes for Mobile */
            .coupon-box { 
                padding: 16px 10px !important; 
                font-size: 20px !important; 
                letter-spacing: 1px !important; 
                max-width: 100% !important;
                width: 100% !important;
            }
            
            .banner-image { border-radius: 13px 13px 0 0 !important; }
            
            /* Typography Scaling */
            h1 { font-size: 18px !important; margin-bottom: 12px !important; }
            .greeting-text { font-size: 26px !important; }
            .subtext { font-size: 14px !important; }
            
            .footer { padding: 20px 20px !important; }
            
            /* Button Fixes: Ensure White Background and Dark Text on Mobile */
            .btn { 
                padding: 14px 28px !important; 
                font-size: 15px !important; 
                background-color: #fafafa !important; 
                color: #131317 !important;
                width: auto !important; /* Ensure it doesn't stretch full width */
            }
        }
    </style>
</head>
<body>

    <div class="container" style="max-width:600px;margin:0 auto;padding:48px 24px;">
        <!-- Animated Gradient Border Wrapper -->
        <div class="running-border" style="border-radius:20px;padding:4px;">
            <div style="background:#131317;border-radius:17px;overflow:hidden;">
                
                <!-- Banner Image -->
                <img src="https://cdn.melinia.in/mln-e-bnr.jpg" alt="Melinia'26" class="banner-image" style="display:block;width:100%;height:auto;border-radius:14px 14px 0 0;max-width:100%;object-fit:cover;">
                
                <div class="content" style="padding:40px 36px;">
                    
                    <!-- Enhanced Greeting Section -->
                    <div style="margin-bottom: 40px; text-align:center;">
                        <p class="greeting-text" style="margin:0; color:#ffffff; font-size:32px; font-weight:800; font-family:system-ui, -apple-system, sans-serif; letter-spacing:-0.5px; line-height: 1.2;">
                            Hello, <span>$capitalized_name</span>
                        </p>
                    </div>

                    <!-- Main Content -->
                    <div style="text-align:center;">
                        
                        <!-- Main Heading -->
                        <!-- Removed text-transform: uppercase -->
                        <h1 style="margin:0 0 14px; color:#71717a; font-size:18px; font-weight:500; letter-spacing:-0.2px; font-family:system-ui, -apple-system, sans-serif;">
                            Your Registration Coupon
                        </h1>
                        
                        <!-- Crisp Subtext -->
                        <p class="subtext" style="margin:0 0 32px; color:#a1a1aa; font-size:16px; line-height:1.6; font-family:system-ui, -apple-system, sans-serif;">
                            Apply the code below to register for Melinia'26.
                        </p>
                        
                        <!-- Coupon Code Box (Static) -->
                        <div class="coupon-box" style="background:#1c1c22; border-radius:14px; padding:24px 28px; display:block; margin:0 auto 32px; max-width:380px; width:calc(100% - 40px); border:2px dashed #52525b; text-align: center;">
                            <div style="color:#fafafa; font-size:26px; font-weight:700; letter-spacing:4px; font-family:'SF Mono','Fira Code','Consolas',monospace; text-transform:uppercase; overflow-wrap:break-word; word-break:break-all;">
                                $coupon_code
                            </div>
                        </div>
                        
                        <!-- Monochrome CTA Button -->
                        <a href="$REGISTER_AT" class="btn" style="display:inline-block; background:#fafafa; color:#131317; text-decoration:none; font-weight:600; font-size:16px; padding:16px 40px; border-radius:10px; margin-bottom:28px; transition:all 0.2s ease; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                            Register Now
                        </a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="footer" style="padding:24px 36px; border-top:1px solid #27272a; text-align:center; background:linear-gradient(180deg, transparent 0%, #18181b 100%);">
                    <p style="margin:0 0 10px; color:#52525b; font-size:12px; font-family:system-ui, -apple-system, sans-serif;">
                        This is an automated message, please do not reply to this email.
                    </p>
                    <p style="margin:0 0 6px; color:#71717a; font-size:12px; font-family:system-ui, -apple-system, sans-serif;">
                        Need assistance? <a href="mailto:helpdesk@melinia.in" style="color:#a1a1aa; text-decoration:underline; transition:color 0.2s ease;">helpdesk@melinia.in</a>
                    </p>
                    <p style="margin:14px 0 0; color:#fafafa; font-size:13px; font-weight:600; letter-spacing:0.5px; font-family:system-ui, -apple-system, sans-serif;">
                        Melinia'26 Dev Team
                    </p>
                </div>
            </div>
        </div>
    </div>

</body>
</html>

--boundary-$(date +%s)--
EOF

    curl -s --url "smtp://$SES_SMTP_HOST:$SES_SMTP_PORT" \
        --ssl-reqd \
        --mail-from "$FROM_EMAIL" \
        --mail-rcpt "$to_email" \
        --user "$SES_SMTP_USERNAME:$SES_SMTP_PASSWORD" \
        --upload-file "$email_file" 2>/dev/null
    
    local result=$?
    rm -f "$email_file"
    return $result
}

# Process one user (called in background)
process_user() {
    local college_mail=$1
    local name=$2
    local coupon_code=$3
    local result_file=$4
    
    local capitalized_name=$(capitalize_name "$name")
    
    # Create coupon
    if create_coupon "$coupon_code" 2>/dev/null; then
        # Send email
        if send_email "$college_mail" "$name" "$coupon_code"; then
            echo "SUCCESS|$capitalized_name|$coupon_code" >> "$result_file"
        else
            echo "FAIL_SMTP|$capitalized_name|$coupon_code" >> "$result_file"
        fi
    else
        echo "FAIL_API|$capitalized_name|$coupon_code" >> "$result_file"
    fi
}

# Export functions for background processes
export -f capitalize_name
export -f generate_random_code
export -f generate_coupon_code
export -f create_coupon
export -f send_email
export -f process_user
export API_ENDPOINT BEARER_TOKEN FROM_EMAIL SES_SMTP_HOST SES_SMTP_PORT SES_SMTP_USERNAME SES_SMTP_PASSWORD REGISTER_AT

# Main execution
echo -e "${BLUE}Melinia'26 Coupon Sender${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create temporary result file
result_file=$(mktemp)
trap "rm -f $result_file" EXIT

line_number=0
batch_count=0
total_users=0

# Read all users into array
declare -a users
while IFS=',' read -r college_mail name roll_no || [[ -n "$college_mail" ]]; do
    line_number=$((line_number + 1))
    
    # Skip header
    if [[ $line_number -eq 1 ]]; then
        continue
    fi
    
    # Trim whitespace
    college_mail=$(echo "$college_mail" | xargs)
    name=$(echo "$name" | xargs)
    
    # Skip empty lines
    if [[ -z "$college_mail" ]] || [[ -z "$name" ]]; then
        continue
    fi
    
    users+=("$college_mail|$name")
done < "$CSV_FILE"

total_users=${#users[@]}
echo -e "${BLUE}📧 Processing $total_users users in batches of $BATCH_SIZE${NC}"
echo ""

# Process users in batches
for ((i=0; i<total_users; i+=BATCH_SIZE)); do
    batch_num=$((i/BATCH_SIZE + 1))
    batch_end=$((i + BATCH_SIZE))
    if [[ $batch_end -gt $total_users ]]; then
        batch_end=$total_users
    fi
    
    echo -e "${YELLOW}📦 Batch $batch_num (${i} - ${batch_end})${NC}"
    
    # Launch parallel processes for this batch
    for ((j=i; j<batch_end && j<total_users; j++)); do
        IFS='|' read -r college_mail name <<< "${users[$j]}"
        coupon_code=$(generate_coupon_code)
        
        printf "  ${YELLOW}►${NC} %-30s ${BLUE}%s${NC}\n" "$(capitalize_name "$name")" "$coupon_code"
        
        # Launch in background
        process_user "$college_mail" "$name" "$coupon_code" "$result_file" &
    done
    
    # Wait for all processes in this batch to complete
    wait
    
    # Pause between batches (except for last batch)
    if [[ $batch_end -lt $total_users ]]; then
        echo -e "${YELLOW}⏸  Pausing 1s...${NC}\n"
        sleep 1
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Process results
success_count=$(grep -c "^SUCCESS" "$result_file" 2>/dev/null | tr -d '\n' || echo "0")
fail_smtp=$(grep -c "^FAIL_SMTP" "$result_file" 2>/dev/null | tr -d '\n' || echo "0")
fail_api=$(grep -c "^FAIL_API" "$result_file" 2>/dev/null | tr -d '\n' || echo "0")

# Ensure numeric values
success_count=${success_count:-0}
fail_smtp=${fail_smtp:-0}
fail_api=${fail_api:-0}
fail_count=$((fail_smtp + fail_api))

echo -e "${GREEN}✓ Success:${NC}    $success_count"
echo -e "${RED}✗ Failed:${NC}     $fail_count"
if [[ $fail_api -gt 0 ]]; then
    echo -e "  ${RED}├─ API:${NC}     $fail_api"
fi
if [[ $fail_smtp -gt 0 ]]; then
    echo -e "  ${RED}└─ SMTP:${NC}    $fail_smtp"
fi
echo -e "${BLUE}📊 Total:${NC}      $((success_count + fail_count))"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Show failed entries if any
if [[ $fail_count -gt 0 ]]; then
    echo ""
    echo -e "${RED}Failed entries:${NC}"
    grep "^FAIL" "$result_file" | while IFS='|' read -r status name code; do
        echo -e "  ${RED}✗${NC} $name ($code) - ${status#FAIL_}"
    done
fi
