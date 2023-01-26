import requests
import base64
import json
import time
import random
import azure.cognitiveservices.speech as speechsdk

from flask import Flask, jsonify, render_template, request, make_response

app = Flask(__name__)

subscription_key = '18166b2a37d54d2986fb8055b239406f'
region = "eastus"
language = "en-US"
voice = "Microsoft Server Speech Text to Speech Voice (en-US, AIGenerate1Neural)"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/readalong")
def readalong():
    return render_template("readalong.html")


@app.route("/gettoken", methods=["POST"])
def gettoken():
    fetch_token_url = 'https://%s.api.cognitive.microsoft.com/sts/v1.0/issueToken' % region
    headers = {
        'Ocp-Apim-Subscription-Key': subscription_key
    }
    response = requests.post(fetch_token_url, headers=headers)
    access_token = response.text
    return jsonify({"at": access_token})


@app.route("/gettonguetwister", methods=["POST"])
def gettonguetwister():
    tonguetwisters = [
                      "English is also considered an essential subject at school. English classes are compulsory from seventh to ninth grade and most students study it until the 12th grade, when they cram for college entrance examinations. The college entrance tests usually give English disproportionately higher weight than other subjects.",
                      "Sleeping only seven hours a night, Kilian Jornet seems almost superhuman. His resting heartbeat is extremely low at 33 beats per minute, compared with the average man's 60 per minute or an athlete's 40 per minute. He breathes more efficiently than average people too, taking in more oxygen per breath, and he has a much faster recovery time after exercise as his body quickly breaks down lactic acid – the acid in muscles that causes pain after exercise.",
                      "In a piece of research done on smiles across cultures, the researchers found that smiling individuals were considered more intelligent than non-smiling people in countries such as Germany, Switzerland, China and Malaysia. However, in countries like Russia, Japan, South Korea and Iran, pictures of smiling faces were rated as less intelligent than the non-smiling ones. Meanwhile, in countries like India, Argentina and the Maldives, smiling was associated with dishonesty.",
                      "Having an increased awareness of the possible differences in expectations and behaviour can help us avoid cases of miscommunication, but it is vital that we also remember that cultural stereotypes can be detrimental to building good business relationships.",
                      "Are things getting worse every day? Is progress an impossible goal? In Enlightenment Now, Steven Pinker looks at the big picture of human progress and finds good news. We are living longer, healthier, freer and happier lives.",
                      "Swedish climate activist Greta Thunberg was hauled away and detained on Tuesday during a protest near a German village, being razed to make way for a coal mine expansion.",
                      " Atmospheric carbon from fossil fuel burning is the main human-caused factor in the escalating global warming we are experiencing now. The current level of carbon in our atmosphere is tracked using what is called the Keeling curve. The Keeling curve measures atmospheric carbon in parts per million (ppm)."]
    level = int(request.args.get('level')) - 1
    return jsonify({"tt": tonguetwisters[level]})


@app.route("/getstory", methods=["POST"])
def getstory():
    id = int(request.form.get("id"))
    stories = [["Read aloud the sentences on the screen.",
                "We will follow along your speech and help you learn speak English.",
                "Good luck for your reading lesson!"],
               ["The Hare and the Tortoise",
                "Once upon a time, a Hare was making fun of the Tortoise for being so slow.",
                "\"Do you ever get anywhere?\" he asked with a mocking laugh.",
                "\"Yes,\" replied the Tortoise, \"and I get there sooner than you think. Let us run a race.\"",
                "The Hare was amused at the idea of running a race with the Tortoise, but agreed anyway.",
                "So the Fox, who had consented to act as judge, marked the distance and started the runners off.",
                "The Hare was soon far out of sight, and in his overconfidence,",
                "he lay down beside the course to take a nap until the Tortoise should catch up.",
                "Meanwhile, the Tortoise kept going slowly but steadily, and, after some time, passed the place where the Hare was sleeping.",
                "The Hare slept on peacefully; and when at last he did wake up, the Tortoise was near the goal.",
                "The Hare now ran his swiftest, but he could not overtake the Tortoise in time.",
                "Slow and Steady wins the race."],
               ["The Ant and The Dove",
                "A Dove saw an Ant fall into a brook.",
                "The Ant struggled in vain to reach the bank,",
                "and in pity, the Dove dropped a blade of straw close beside it.",
                "Clinging to the straw like a shipwrecked sailor, the Ant floated safely to shore.",
                "Soon after, the Ant saw a man getting ready to kill the Dove with a stone.",
                "Just as he cast the stone, the Ant stung the man in the heel, and he missed his aim,",
                "The startled Dove flew to safety in a distant wood and lived to see another day.",
                "A kindness is never wasted."]]
    if (id >= len(stories)):
        return jsonify({"code": 201})
    else:
        return jsonify({"code": 200, "storyid": id, "storynumelements": len(stories[id]), "story": stories[id]})


@app.route("/ackaud", methods=["POST"])
def ackaud():
    f = request.files['audio_data']
    reftext = request.form.get("reftext")
    #    f.save(audio)
    # print('file uploaded successfully')

    # a generator which reads audio data chunk by chunk
    # the audio_source can be any audio input stream which provides read() method, e.g. audio file, microphone, memory stream, etc.
    def get_chunk(audio_source, chunk_size=1024):
        while True:
            # time.sleep(chunk_size / 32000) # to simulate human speaking rate
            chunk = audio_source.read(chunk_size)
            if not chunk:
                # global uploadFinishTime
                # uploadFinishTime = time.time()
                break
            yield chunk

    # build pronunciation assessment parameters
    referenceText = reftext
    # Test Granularity
    # granularity:Phonema
    # pronAssessmentParamsJson = "{\"ReferenceText\":\"%s\",\"gradingSystem\":\"HundredMark\",\"Dimension\":\"Comprehensive\",\"granularity\":\"Phoneme\",\"phonemeAlphabet\":\"IPA\",\"nBestPhonemeCount\":5}" % referenceText
    # granularity:Word
    # pronAssessmentParamsJson = "{\"ReferenceText\":\"%s\",\"gradingSystem\":\"HundredMark\",\"Dimension\":\"Comprehensive\",\"granularity\":\"Word\",\"phonemeAlphabet\":\"IPA\",\"nBestPhonemeCount\":5}" % referenceText
    # granularity:FullText
    # pronAssessmentParamsJson = "{\"ReferenceText\":\"%s\",\"gradingSystem\":\"HundredMark\",\"Dimension\":\"Comprehensive\",\"granularity\":\"FullText\",\"phonemeAlphabet\":\"IPA\",\"nBestPhonemeCount\":5}" % referenceText
    # Fin Test Granularity

    # Test Dimension
    # Dimension:Basic
    # pronAssessmentParamsJson = "{\"ReferenceText\":\"%s\",\"gradingSystem\":\"HundredMark\",\"Dimension\":\"Basic\",\"granularity\":\"Phoneme\",\"phonemeAlphabet\":\"IPA\",\"nBestPhonemeCount\":5}" % referenceText
    # Dimension:Basic
    # pronAssessmentParamsJson = "{\"ReferenceText\":\"%s\",\"gradingSystem\":\"HundredMark\",\"Dimension\":\"Basic\",\"granularity\":\"Word\",\"phonemeAlphabet\":\"IPA\",\"nBestPhonemeCount\":5}" % referenceText
    # Dimension:Basic
    # pronAssessmentParamsJson = "{\"ReferenceText\":\"%s\",\"gradingSystem\":\"HundredMark\",\"Dimension\":\"Basic\",\"granularity\":\"FullText\",\"phonemeAlphabet\":\"IPA\",\"nBestPhonemeCount\":5}" % referenceText

    # EnableMiscue:True
    # pronAssessmentParamsJson = "{\"ReferenceText\":\"%s\",\"gradingSystem\":\"HundredMark\",\"EnableMiscue\":\"True\",\"Dimension\":\"Comprehensive\",\"granularity\":\"Phoneme\",\"phonemeAlphabet\":\"IPA\",\"nBestPhonemeCount\":5}" % referenceText
    # EnableMiscue:False
    pronAssessmentParamsJson = "{\"ReferenceText\":\"%s\",\"gradingSystem\":\"HundredMark\",\"EnableMiscue\":\"False\",\"Dimension\":\"Comprehensive\",\"granularity\":\"Phoneme\",\"phonemeAlphabet\":\"SAPI\",\"nBestPhonemeCount\":1}" % referenceText
    pronAssessmentParamsBase64 = base64.b64encode(
        bytes(pronAssessmentParamsJson, 'utf-8'))
    pronAssessmentParams = str(pronAssessmentParamsBase64, "utf-8")

    # build request
    url = "https://%s.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=%s&usePipelineVersion=0" % (
        region, language)
    headers = {'Accept': 'application/json;text/xml',
               'Connection': 'Keep-Alive',
               'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=44100',
               'Ocp-Apim-Subscription-Key': subscription_key,
               'Pronunciation-Assessment': pronAssessmentParams,
               'Transfer-Encoding': 'chunked',
               'Expect': '100-Continue'
               # 'Expect': '200-OK'
               }

    # audioFile = open('audio.wav', 'rb')
    audioFile = f
    # send request with chunked data
    response = requests.post(
        url=url, data=get_chunk(audioFile), headers=headers)
    # getResponseTime = time.time()
    audioFile.close()

    # latency = getResponseTime - uploadFinishTime
    # print("Latency = %sms" % int(latency * 1000))

    return response.json()


@app.route("/gettts", methods=["POST"])
def gettts():
    reftext = request.form.get("reftext")
    # Creates an instance of a speech config with specified subscription key and service region.
    speech_config = speechsdk.SpeechConfig(
        subscription=subscription_key, region=region)
    speech_config.speech_synthesis_voice_name = voice

    offsets = []

    def wordbound(evt):
        offsets.append(evt.audio_offset / 10000)

    # Creates a speech synthesizer with a null output stream.
    # This means the audio output data will not be written to any output channel.
    # You can just get the audio from the result.
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None)
    print(speech_synthesizer.SpeechSynthesisResult())
    # Subscribes to word boundary event
    # The unit of evt.audio_offset is tick (1 tick = 100 nanoseconds), divide it by 10,000 to convert to milliseconds.
    speech_synthesizer.synthesis_word_boundary.connect(wordbound)

    result = speech_synthesizer.speak_text_async(reftext).get()
    # Check result
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        # print("Speech synthesized for text [{}]".format(reftext))
        # print(offsets)
        # SpeechSynthesisResult.getAudioLength()--------------->
        audio_data = result.audio_data
        print(audio_data)
        # print("{} bytes of audio data received.".format(len(audio_data)))

        response = make_response(audio_data)
        response.headers['Content-Type'] = 'audio/wav'
        response.headers['Content-Disposition'] = 'attachment; filename=sound.wav'
        # response.headers['reftext'] = reftext
        response.headers['offsets'] = offsets
        return response

    elif result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = result.cancellation_details
        print("Speech synthesis canceled: {}".format(
            cancellation_details.reason))
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            print("Error details: {}".format(
                cancellation_details.error_details))
        return jsonify({"success": False})


@app.route("/getttsforword", methods=["POST"])
def getttsforword():
    word = request.form.get("word")

    # Creates an instance of a speech config with specified subscription key and service region.
    speech_config = speechsdk.SpeechConfig(
        subscription=subscription_key, region=region)
    speech_config.speech_synthesis_voice_name = voice

    # Creates a speech synthesizer with a null output stream.
    # This means the audio output data will not be written to any output channel.
    # You can just get the audio from the result.
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None)

    result = speech_synthesizer.speak_text_async(word).get()
    # Check result
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        # print("Speech synthesized for text [{}]".format(reftext))
        # print(offsets)
        audio_data = result.audio_data
        # print(audio_data)
        # print("{} bytes of audio data received.".format(len(audio_data)))

        response = make_response(audio_data)
        response.headers['Content-Type'] = 'audio/wav'
        response.headers['Content-Disposition'] = 'attachment; filename=sound.wav'
        # response.headers['word'] = word
        return response

    elif result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = result.cancellation_details
        print("Speech synthesis canceled: {}".format(
            cancellation_details.reason))
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            print("Error details: {}".format(
                cancellation_details.error_details))
        return jsonify({"success": False})
