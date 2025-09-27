# Metrics Generation Agent

## Overview

The **Metrics Generation Agent** transforms raw brand intelligence into actionable business metrics. Built on **Fetch.ai's uAgents framework** and powered by **SingularityNET's MeTTa Knowledge Graph**, it generates comprehensive brand health assessments, strategic insights, and performance indicators for enterprise decision-making.

### Core Capabilities
- **Comprehensive Brand Metrics**: Multi-dimensional scoring across 6 key metric categories
- **AI-Powered Analysis**: ASI:One LLM integration for intelligent metric generation
- **Knowledge Graph Integration**: Real-time queries to orchestrator's brand knowledge repository
- **Strategic Insights**: Business-ready recommendations and urgency assessments
- **Agent-to-Agent Communication**: Seamless data sharing with bounty generation systems
- **Interactive Query Processing**: Natural language brand research and analysis

---

## System Architecture

```
                    Metrics Generation Agent Architecture                       
─────────────────────────────────────────────────────────────────────────────────
                                                                                 
                          Data Ingestion Layer                              
                                                                             
  Knowledge Graph ──┐    Brand Summary ──┐    Query Interface ──┐   
     Orchestrator      │       Retrieval       │       Processing       │   
                       ▼                       ▼                         ▼   
  REST API Client ──────▶ BrandRAG ◀─────────── Chat Protocol      
                                                                             
                                         │                                       
                                         ▼                                       
                        MeTTa Knowledge Processing                           
                                                                             
   Local MeTTa   ───▶   FAQ & Intent  ───▶   Query         
   Instance            Classification       Processing      
                                                                             
                                         │                                       
                                         ▼                                       
                          ASI:One Analytics Engine                           
                                                                             
  Brand Data ──▶ ASI:One LLM ──▶ Metrics Generation ──▶ Insights 
                                                                             
                        6 Metric Categories                              
                                                                         
  Sentiment      Reputation    Market Position                 
     Metrics           Risk            Metrics                          
                                                                         
  Customer       Performance    Strategic                       
     Experience        Indicators       Insights                        
                                                                         
                                                                             
                                         │                                       
                                         ▼                                       
                        Output & Communication Layer                         
                                                                             
  REST API ──┐    Chat Protocol ──┐    A2A Communication ──┐        
   Responses    │       Responses        │       to Bounty Agent     │        
                ▼                        ▼                           ▼        
  JSON Metrics ──────▶ Business Intelligence ◀────── Action Items   
                                                                             
                                                                                 
─────────────────────────────────────────────────────────────────────────────────
```

---

## Comprehensive Metrics Framework

### **6-Dimensional Brand Analysis**

The agent generates metrics across six critical business dimensions:

#### **1. Sentiment Metrics**
- **Overall Brand Sentiment Score**: Aggregated sentiment across all platforms (0-100)
- **Web Media Sentiment Score**: News and web content sentiment analysis
- **Customer Review Sentiment Score**: Review platform sentiment evaluation
- **Social Media Sentiment Score**: Social platform engagement sentiment
- **Sentiment Volatility Score**: Sentiment stability and consistency
- **Positive Mention Ratio**: Percentage of positive vs. total mentions

#### **2. Reputation Risk Metrics**
- **Crisis Severity Level**: Current crisis intensity assessment (0-100)
- **Active Safety Recalls Count**: Number of active product recalls
- **Reputation Vulnerability Score**: Susceptibility to reputation damage
- **Regulatory Attention Score**: Government and regulatory scrutiny level
- **Negative Media Coverage Intensity**: Volume and impact of negative coverage

#### **3. Market Position Metrics**
- **Competitive Advantage Score**: Unique market positioning strength
- **Competitive Pressure Intensity**: Market competition pressure level
- **Market Leadership Perception**: Industry leadership recognition
- **Brand Differentiation Score**: Unique value proposition strength
- **Industry Innovation Ranking**: Innovation leadership position

#### **4. Customer Experience Metrics**
- **Customer Satisfaction Proxy**: Inferred satisfaction from feedback
- **Review Volume Strength**: Customer engagement and feedback volume
- **Customer Advocacy Level**: Brand promotion and recommendation strength
- **Complaint Resolution Effectiveness**: Issue resolution capability
- **Service Quality Perception**: Customer service quality assessment

#### **5. Performance Indicators**
- **Brand Health Index**: Overall brand wellness score
- **Brand Resilience Score**: Ability to withstand market challenges
- **Growth Potential Indicator**: Future growth opportunity assessment
- **Stakeholder Confidence Level**: Investor and partner confidence
- **Future Readiness Score**: Adaptability to market changes

#### **6. Strategic Insights**
- **Primary Improvement Area**: Key focus area for enhancement
- **Urgency Level**: Action priority (LOW|MEDIUM|HIGH|CRITICAL)
- **Investment Priority Score**: Resource allocation recommendation
- **Competitive Threat Level**: Market threat assessment
- **Brand Momentum Direction**: Growth trajectory analysis

---

## Data Flow & Processing

### **Knowledge Graph Integration**

The agent connects to the orchestrator's knowledge graph through a sophisticated data retrieval system:

#### **Data Sources**
- **Web Search Results**: General brand research and web presence
- **Positive Reviews**: Customer testimonials and positive feedback
- **Negative Reviews**: Customer complaints and criticism
- **Positive Reddit**: Community praise and positive discussions
- **Negative Reddit**: Community complaints and issues
- **Positive Social Media**: Social platform praise and engagement
- **Negative Social Media**: Social platform criticism and complaints

#### **Processing Pipeline**
1. **Brand Data Retrieval**: Query comprehensive brand summary from knowledge graph
2. **Data Segmentation**: Organize data by type and sentiment
3. **LLM Analysis**: ASI:One processes all data for metric generation
4. **Score Calculation**: Generate 0-100 scores across all metric categories
5. **Strategic Assessment**: Determine improvement areas and urgency levels
6. **Response Formatting**: Structure results for business consumption

---

## AI-Powered Analytics Engine

### **ASI:One Integration**

The agent leverages **ASI:One's asi1-mini model** for sophisticated brand analysis:

#### **Comprehensive Analysis Prompt**
The system uses a detailed prompt structure that instructs the AI to:
- **Analyze Multi-Source Data**: Process web, review, Reddit, and social media data
- **Apply Scoring Guidelines**: Use consistent 0-100 scoring with defined ranges
- **Generate Strategic Insights**: Provide actionable business recommendations
- **Maintain JSON Structure**: Return structured data for system integration

#### **Scoring Guidelines**
- **0-25**: Poor/Critical - Immediate attention required
- **26-50**: Below Average/Needs Improvement - Action recommended
- **51-75**: Good/Acceptable - Monitor and optimize
- **76-100**: Excellent/Outstanding - Maintain and leverage

---

## API Architecture

### **REST API Endpoints**

#### **Core Brand Analysis**
- **POST** `/brand/research` - Comprehensive brand research
- **POST** `/brand/query` - Natural language brand queries
- **POST** `/brand/data` - Specific data type queries
- **POST** `/brand/summary` - Complete brand data summary

#### **Metrics Generation**
- **POST** `/brand/metrics` - Generate comprehensive brand metrics
- **GET** `/brand/metrics/last` - Retrieve last generated metrics

#### **System Operations**
- **GET** `/brands/all` - List all available brands

### **Chat Protocol Integration**

The agent implements Fetch.ai's Chat Protocol for seamless integration with:
- **ASI:One Interface**: Direct AI assistant interaction
- **Agentverse Platform**: Agent discovery and communication
- **Multi-Modal Communication**: Text-based brand research assistance

---

## Technical Components

### **Modular Architecture**

#### **Core Agent** (`agent.py`)
- **uAgent Framework**: Main agent implementation with protocol handling
- **REST API Handlers**: Comprehensive endpoint management
- **A2A Communication**: Agent-to-agent message handling
- **Global State Management**: Metrics storage and retrieval

#### **Brand RAG System** (`brand/brandrag.py`)
- **Knowledge Graph Client**: REST API client for orchestrator communication
- **Data Retrieval Methods**: Specialized methods for different data types
- **Error Handling**: Robust error management and logging

#### **Knowledge Management** (`brand/knowledge.py`)
- **MeTTa Initialization**: Local knowledge graph setup
- **FAQ Integration**: Common query handling
- **Schema Definition**: Brand relationship modeling

#### **LLM Integration** (`brand/utils.py`)
- **ASI:One Client**: OpenAI-compatible API client
- **Intent Classification**: Query intent analysis
- **Response Generation**: Intelligent response formatting

---

## Usage Examples

### **Generate Brand Metrics**
```bash
curl -X POST http://localhost:8080/brand/metrics \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Tesla"}'
```

### **Brand Research Query**
```bash
curl -X POST http://localhost:8080/brand/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the sentiment analysis for Apple?"}'
```

### **Get Brand Summary**
```bash
curl -X POST http://localhost:8080/brand/summary \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Nike"}'
```

### **Retrieve Last Metrics**
```bash
curl http://localhost:8080/brand/metrics/last
```

---

## Sample Metrics Output

### **Comprehensive Brand Analysis Response**
```json
{
  "brand_analysis_metadata": {
    "brand_name": "Tesla",
    "analysis_timestamp": "2024-03-21T10:30:00Z",
    "analysis_model": "asi1-mini"
  },
  "sentiment_metrics": {
    "overall_brand_sentiment_score": 75,
    "web_media_sentiment_score": 78,
    "customer_review_sentiment_score": 72,
    "social_media_sentiment_score": 70,
    "sentiment_volatility_score": 65,
    "positive_mention_ratio": 68
  },
  "reputation_risk_metrics": {
    "crisis_severity_level": 45,
    "active_safety_recalls_count": 2,
    "reputation_vulnerability_score": 55,
    "regulatory_attention_score": 60,
    "negative_media_coverage_intensity": 50
  },
  "strategic_insights": {
    "primary_improvement_area": "Customer Experience",
    "urgency_level": "MEDIUM",
    "investment_priority_score": 70,
    "competitive_threat_level": 60,
    "brand_momentum_direction": "GROWING"
  }
}
```

---

## Agent-to-Agent Communication

### **Bounty Agent Integration**

The metrics agent automatically communicates with the bounty generation system:

#### **Data Sharing Process**
1. **Metrics Generation**: Complete brand analysis performed
2. **Data Packaging**: Brand summary data structured for bounty agent
3. **A2A Communication**: Automatic message sending to bounty agent
4. **Acknowledgment Handling**: Confirmation receipt from bounty system

#### **Shared Data Structure**
- **Brand Name**: Target brand identifier
- **Multi-Source Data**: Web, reviews, Reddit, social media results
- **Timestamp**: Analysis completion time
- **Source Agent**: Metrics agent identification

---

## Use Cases & Applications

### **Enterprise Brand Management**
- **Brand Health Monitoring**: Regular brand wellness assessments
- **Crisis Management**: Early warning systems and severity assessment
- **Strategic Planning**: Data-driven brand strategy development
- **Investment Decisions**: ROI analysis and resource allocation guidance

### **Marketing Intelligence**
- **Campaign Performance**: Multi-platform sentiment tracking
- **Competitive Analysis**: Market positioning and threat assessment
- **Customer Experience**: Satisfaction and advocacy measurement
- **Market Research**: Industry leadership and innovation ranking

### **Operational Excellence**
- **Performance Tracking**: KPI monitoring and trend analysis
- **Risk Assessment**: Reputation vulnerability and crisis preparedness
- **Growth Planning**: Market opportunity and readiness evaluation
- **Stakeholder Reporting**: Executive dashboard and strategic insights

---

## Conclusion

The **Metrics Generation Agent** transforms complex multi-source data into actionable business insights. By combining **advanced analysis** with **structured knowledge graphs** and **enterprise-grade metrics**, it provides organizations with the intelligence needed for data-driven brand management and strategic decision-making.

### **Key Innovations**
- **AI-Powered Analysis**: ASI:One integration for sophisticated brand assessment
- **Comprehensive Metrics**: 6-dimensional scoring across critical business areas
- **Knowledge Integration**: Real-time connection to orchestrator's brand intelligence
- **Agent Communication**: Seamless integration with bounty generation systems
- **Strategic Insights**: Business-ready recommendations and priority assessments

### **Transformative Impact**
- **Data-Driven Decisions**: Evidence-based brand strategy development
- **Risk Management**: Proactive crisis detection and reputation protection
- **Competitive Advantage**: Market positioning and differentiation insights
- **Customer Focus**: Experience optimization and satisfaction improvement

Perfect for enterprises seeking comprehensive brand intelligence, strategic insights, and performance optimization through advanced AI-powered analytics.

---

*Transforming brand data into business intelligence.*
