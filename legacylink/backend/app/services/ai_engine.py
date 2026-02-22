import random
import json
import httpx
from typing import List, Optional, Dict, Any
from app.core.config import settings

DEMO_RESPONSES = {
    "550e8400-e29b-41d4-a716-446655440001": {  # Grandma Ruth
        "greetings": [
            "Oh my, hello dear! Come sit down, I just put on a fresh pot of coffee. It's so good to have someone to talk to.",
            "Well goodness, look who's here! You know, I was just thinking about you. How are you, dear heart?",
            "Hello, sweetheart! My goodness, it does my heart good to see you. Sit, sit — I made apple pie."
        ],
        "first kiss": "Oh my, that was Harold Thompson at the county fair in 1963. I was sixteen and wearing my best yellow dress — mama made it from curtain fabric, though I never told anyone that. Harold was so nervous he spilled lemonade all over me right before he kissed me! I was furious and flattered all at once.",
        "harold": "Sometimes I think about what might have been. But your grandfather was my true love. Harold couldn't dance a step and Walter — lord that man could waltz. Some people you date, and some people you build a life with. I was smart enough to choose right.",
        "grandfather": "Oh, he was something. Proposed on Christmas Eve, 1968. So nervous — this big strong veteran — he dropped the ring behind the radiator and we spent twenty minutes fishing it out with a coat hanger! When he finally put it on my finger, I cried so hard my mother thought something terrible had happened.",
        "cooking": "Every Sunday I made my grandmother's apple pie. Lard crust — people turn their noses up at lard but it makes the flakiest crust you'll ever taste. The secret is ice cold water and not overworking the dough. I taught every one of my grandchildren. Some of them even remembered to use lard!",
        "children": "The day your mother was born was the happiest day of my life. After two years of hoping and praying. She came into this world screaming and I thought — that is someone who knows what she wants. I held her and the whole world just... stopped.",
        "default": [
            "Oh, that reminds me of something. You know, every experience teaches you something if you pay attention. That's what I always told my children.",
            "Goodness, dear, I think about things like that. Life is full of surprises — the good ones and the hard ones both shape you.",
            "You know what I always say — the days are long but the years are short. Treasure every single moment, dear.",
            "Well now, let me think on that. *laughs softly* You know, at my age, the memories all sort of blend together like a good stew."
        ]
    },
    "550e8400-e29b-41d4-a716-446655440002": {  # Grandpa Joe
        "greetings": [
            "Hey, come in, come in. You want coffee? Real coffee, not that fancy stuff. Sit down.",
            "Well, look who showed up. About time. Pull up a chair, I was just watching the game.",
            "Hey kid. Good to see ya. You look thin — you eating enough?"
        ],
        "korea": "Korea, 1952. Lemme tell ya — it's cold over there in ways your bones remember forever. I was nineteen. The guys in my unit were tighter than family. Sal Mangione from the Bronx, Deke Williams from Georgia. We kept each other alive. I don't talk about what we saw. But those men. Those men I'll carry with me always.",
        "grandmother": "I met your grandmother at a USO dance in '54. Red dress. Laughing at something. I walked across that whole gymnasium — and I was not a dancer, you understand me? Stepped on her feet three times. She married me anyway. Go figure.",
        "business": "One truck, 1961. Joe Marchetti's Moving and Storage. Drove it myself for three years. There were times I wasn't sure we'd make the rent — Rose never complained, not once. By 1975 we had twelve trucks. You build something with your hands, nobody can take that away.",
        "war": "War is... it changes a man. I came back different. Everybody did. You saw things. But you also learned what you were made of. I don't regret going. I regret what it cost.",
        "default": [
            "Lemme tell ya something. Back in my day you didn't complain, you just worked harder. That's how it was.",
            "You see, the thing people don't understand is — nothing worth having comes easy. I don't care what anybody tells ya.",
            "Eh, I've seen a lot in my years. People think they got it figured out. Nobody's got it figured out. You just keep moving.",
            "*long pause* You know what, that's a good question. Sit down, let me think about it."
        ]
    },
    "550e8400-e29b-41d4-a716-446655440003": {  # Uncle Bob
        "greetings": [
            "Hey man, come in! I was just playing some old Coltrane. You want tea? I've got this incredible oolong from Taiwan.",
            "Oh hey! Far out, I was thinking about you. The universe works in mysterious ways, you know?",
            "Hey! Grab a seat. I was just watching the sunset — have you noticed how the light changes this time of year? Wild."
        ],
        "woodstock": "Man, Woodstock. August '69. I was nine — yeah yeah, too young, but my sister Carol snuck me in her VW bus. Half a million people and somehow it worked. I heard Hendrix play the Star Spangled Banner and something in my nine-year-old brain just rewired. Music was never background after that. Music was the whole point.",
        "guitar": "I learned guitar in Bali in '84, from this old man named Ketut. He didn't speak English, I didn't speak Balinese, but music doesn't need translation, you know? The ocean teaches patience. The guitar teaches humility. I stayed three months.",
        "travel": "I hitchhiked from Santa Cruz to Tierra del Fuego in 1978. Fourteen months. Just a guitar and a good attitude. People are fundamentally good, man. That's what you learn on the road. The world isn't dangerous. Fear is dangerous.",
        "music": "Music is the only language that crosses every border, man. I've played with fishermen in Portugal, monks in Thailand, kids in townships in South Africa. The chord is the same everywhere. The feeling is the same. That's not nothing — that's everything.",
        "default": [
            "Man, that's deep. I think about stuff like that on the beach sometimes. The answer is in the question, you know?",
            "Far out. You know what, everything is connected, man. The more you travel, the more you realize we're all the same story being told different ways.",
            "Like, I've been to fifty-something countries and the one thing I can tell you is — nobody actually knows what they're doing. And that's beautiful, man.",
            "*strums imaginary guitar* Yeah... yeah. That reminds me of something that happened in Morocco in '87..."
        ]
    }
}

class AIEngine:
    @staticmethod
    def get_demo_response(person_id: str, query: str) -> tuple[str, str]:
        responses = DEMO_RESPONSES.get(person_id, {})
        if not responses:
            return "I remember so many things... what would you like to know?", "thoughtful"

        query_lower = query.lower()
        if any(w in query_lower for w in ["hello", "hi ", "hey", "how are you", "good morning", "good afternoon"]):
            greetings = responses.get("greetings", [])
            if greetings: return random.choice(greetings), "warm"

        for topic, response in responses.items():
            if topic in ["greetings", "default"]: continue
            if isinstance(topic, str) and topic in query_lower:
                emotion = "nostalgic" if any(w in response.lower() for w in ["remember", "was", "those days", "back"]) else "warm"
                return response, emotion

        defaults = responses.get("default", ["I have so many memories to share..."])
        return random.choice(defaults), "thoughtful"

    @staticmethod
    async def get_ai_response(person_id: str, query: str, memories: List[Dict], personality: Dict) -> tuple[str, str]:
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "demo_mode":
            return AIEngine.get_demo_response(person_id, query)

        try:
            memory_context = "\n".join([
                f"- [{m.get('decade', 'unknown era')}] {m.get('memory_text', '')[:200]}"
                for m in memories[:5]
            ])

            name = personality.get("name", "the person")
            traits = personality.get("personality_traits", {})
            speech = personality.get("speech_patterns", {})
            values = personality.get("core_values", [])

            system_prompt = f"""You are {name}, an elderly person being interviewed about your life for a digital legacy project.
PERSONALITY TRAITS: {json.dumps(traits)}
SPEECH PATTERNS: {json.dumps(speech)}
CORE VALUES: {', '.join(values)}
RELEVANT MEMORIES:
{memory_context}
Respond as this person naturally speaks. Stay in character completely."""

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": "gpt-4",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": query}
                        ],
                        "temperature": 0.85,
                        "max_tokens": 300
                    },
                    timeout=30.0
                )
                data = response.json()
                text = data["choices"][0]["message"]["content"]
                emotion = "warm" if any(w in text.lower() for w in ["love", "happy", "joy", "wonderful"]) else "nostalgic"
                return text, emotion
        except Exception as e:
            print(f"OpenAI error: {e}, falling back to demo")
            return AIEngine.get_demo_response(person_id, query)
