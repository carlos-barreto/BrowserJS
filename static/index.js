var duration = document.getElementById("duration");
var min_accuracyscore = document.getElementById("min_accuracyscore");
var ineer_level = document.getElementById("level");
var ineer_score = document.getElementById("score");
/* Nuevas variables */
var ineer_num_words = document.getElementById("num_words"); //cantidad de palabras
var ineer_machine_seconds = document.getElementById("machine_seconds"); //segundos maquina
var ineer_user_seconds = document.getElementById("user_seconds"); //segundos usuario
var ineer_native_words = document.getElementById("native_words");
var ineer_native_words_percentage = document.getElementById("native_words_percentage");
var ineer_user_words = document.getElementById("user_words");
var ineer_user_words_percentage = document.getElementById("user_words_percentage");


var accuracyscore = document.getElementById("accuracyscore");
var fluencyscore = document.getElementById("fluencyscore");
var completenessscore = document.getElementById("completenessscore");
var pronscore = document.getElementById("pronscore");
var wordsomitted = document.getElementById("wordsomitted");
var wordsinserted = document.getElementById("wordsinserted");
var omittedwords = "";
var insertedwords = "";
wordsinserted.style.display = "none";
document.getElementById("wih").style.display = "none";

var wordrow = document.getElementById("wordrow");
var phonemerow = document.getElementById("phonemerow");
var scorerow = document.getElementById("scorerow");

var reftext = document.getElementById("reftext");
var formcontainer = document.getElementById("formcontainer");
var ttbutton = document.getElementById("randomtt");
var hbutton = document.getElementById("buttonhear");
var recordingsList = document.getElementById("recordingsList");
var ttsList = document.getElementById("ttsList");
var lastgettstext;
var objectUrlMain;
var wordaudiourls = new Array();

var phthreshold1 = 80;
var phthreshold2 = 60;
var phthreshold3 = 40;
var phthreshold4 = 20;

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContent;
var start = false;
var stop = false;
var permission = false;
var reftextval;
var gumStream; //stream from getUserMedia()
var rec; //Recorder.js object
var audioStream; //MediaStreamAudioSourceNode we'll be recording
var blobpronun;
var offsetsarr;
var tflag = true;
var wordlist;

var t0 = 0;
var t1;
var at;

window.onload = () => {
    validateStatusLocalStorage();
    if (tflag) {
        tflag = gettoken();
        tflag = false;
    }
    var request = new XMLHttpRequest();
    request.open("POST", "/gettonguetwister?level=" + localStorage.getItem("level"), true);

    // Callback function for when request completes
    request.onload = () => {
        // Extract JSON data from request
        const data = JSON.parse(request.responseText);
        reftextval = data.tt;
        reftext.value = reftextval;
        reftext.innerText = reftextval;
    };

    //send request
    request.send();
    ttbutton.disabled = true;
    return false;
};


function gettoken() {
    var request = new XMLHttpRequest();
    request.open("POST", "/gettoken", true);

    // Callback function for when request completes
    request.onload = () => {
        // Extract JSON data from request
        const data = JSON.parse(request.responseText);
        at = data.at;
    };

    //send request
    request.send();
    return false;
}

function playword(k) {
    var audio = document.getElementById("ttsaudio");
    audio.playbackRate = 0.5;
    audio.currentTime = offsetsarr[k] / 1000 + 0;

    var stopafter = 10000;

    if (k != offsetsarr.length - 1) {
        stopafter = offsetsarr[k + 1] / 1000 + 0.01;
    }

    audio.play();

    var pausing_function = function () {
        if (this.currentTime >= stopafter) {
            this.pause();
            this.currentTime = 0;
            stopafter = 10000;
            // remove the event listener after you paused the playback
            this.removeEventListener("timeupdate", pausing_function);
            audio.playbackRate = 0.9;
        }
    };

    audio.addEventListener("timeupdate", pausing_function);
}

function playwordind(word) {
    var audio = document.getElementById("ttsaudio");
    audio.playbackRate = 0.5;

    for (var i = 0; i < wordaudiourls.length; i++) {
        if (wordaudiourls[i].word == word) {
            audio.src = wordaudiourls[i].objectUrl;
            audio.playbackRate = 0.7;
            audio.play();
            break;
        }
    }

    var ending_function = function () {
        audio.src = objectUrlMain;
        audio.playbackRate = 0.9;
        audio.autoplay = false;
        audio.removeEventListener("ended", ending_function);
    };

    audio.addEventListener("ended", ending_function);
}

reftext.onclick = function () {
    handleWordClick();
};

function handleWordClick() {
    const activeTextarea = document.activeElement;
    var k = activeTextarea.selectionStart;

    reftextval = reftext.value;
    // console.log(reftextval);
    if (reftextval) {
        wordlist = reftextval.split(" ");

        var c = 0;
        var i = 0;
        for (i = 0; i < wordlist.length; i++) {
            c += wordlist[i].length;
            if (c >= k) {
                playwordind(wordlist[i]);
                //playword(i);
                break;
            }
            c += 1;
        }
        console.log("si");
    } else {
        console.log("No Words");
    }
}

var soundAllowed = function (stream) {
    permission = true;
    audioContent = new AudioContext();
    gumStream = stream;
    audioStream = audioContent.createMediaStreamSource(stream);
    rec = new Recorder(audioStream, {numChannels: 1});
    //console.log(rec, "rec");
    //start the recording process
    rec.record();
};

var soundNotAllowed = function (error) {
    console.log(error);
    h.innerHTML = "You must allow your microphone.";
};

//function for onclick of hear pronunciation button
hbutton.onclick = function () {
    reftextval = reftext.value;

    if (reftextval != lastgettstext) {
        document.getElementById("ttsloader").style.display = "block";

        var request = new XMLHttpRequest();
        request.open("POST", "/gettts", true);
        request.responseType = "blob";

        // Callback function for when request completes
        request.onload = () => {
            var blobpronun = request.response;
            var offsets = request.getResponseHeader("offsets");
            offsetsarr = offsets
                .substring(1, offsets.length - 1)
                .replace(/ /g, "")
                .split(",")
                .map(Number);

            objectUrlMain = URL.createObjectURL(blobpronun);

            var au = document.createElement("audio");
            var li = document.createElement("p");

            //add controls to the <audio> element
            au.controls = true;
            au.autoplay = true;
            au.id = "ttsaudio";
            au.src = objectUrlMain;

            //add the new audio element to li
            li.appendChild(au);

            //add the li element to the ol

            if (ttsList.hasChildNodes()) {
                ttsList.lastChild.remove();
            }

            ttsList.appendChild(li);

            document.getElementById("ttsloader").style.display = "none";
        };
        const dat = new FormData();
        dat.append("reftext", reftextval);

        //send request
        request.send(dat);

        lastgettstext = reftextval;

        wordlist = reftextval.split(" ");
        for (var i = 0; i < wordlist.length; i++) {
            getttsforword(wordlist[i]);
        }
    } else {
        console.log(
            "TTS Audio for given text already exists. You may change ref text"
        );
    }

    return false;
};

function getttsforword(word) {
    var request = new XMLHttpRequest();
    request.open("POST", "/getttsforword", true);
    request.responseType = "blob";

    // Callback function for when request completes
    request.onload = () => {
        var blobpronun = request.response;
        var objectUrl = URL.createObjectURL(blobpronun);
        wordaudiourls.push({word, objectUrl});
    };
    const dat = new FormData();
    dat.append("word", word);

    //send request
    request.send(dat);
}

//function for onclick of get tongue twister button
ttbutton.onclick = function () {
    var request = new XMLHttpRequest();
    request.open("POST", "/gettonguetwister?level=" + localStorage.getItem("level"), true);

    // Callback function for when request completes
    request.onload = () => {
        // Extract JSON data from request
        const data = JSON.parse(request.responseText);
        reftextval = data.tt;
        reftext.value = reftextval;
        reftext.innerText = reftextval;
    };

    //send request
    request.send();
    window.location.reload();
    return false;
};

//function for handling main button clicks
document.getElementById("buttonmic").onclick = function () {
    if (reftext.value.length == 0) {
        alert("Reference Text cannot be empty!");
    } else {
        if (stop) {
            start = true;
            stop = false;
            let history = JSON.parse(window.localStorage.getItem("history"));
            window.localStorage.removeItem("level");
            console.log(history);
            window.localStorage.setItem("level", parseInt(history.level++));
            // window.location.reload();
        } else if (start) {
            start = false;
            stop = true;
            this.innerHTML = "<span class=''></span>Iniciar Grabación";
            this.className = "button fit icon solid fa-microphone";
            rec.stop();
            // console.log("stop", start, stop, rec, gumStream);
            //stop microphone access
            gumStream.getAudioTracks()[0].stop();

            //create the wav blob and pass it on to createDownloadLink
            rec.exportWAV(createDownloadLink);

        } else {
            if (!permission) {
                navigator.mediaDevices
                    .getUserMedia({audio: true})
                    .then(function (mediaStream) {
                        /* usar el flujo de datos */
                        soundAllowed(mediaStream);
                    })
                    .catch(function (err) {
                        /* manejar el error */
                        console.log("err", err);
                        soundNotAllowed(err);
                    });
            }

            start = true;
            reftext.readonly = true;
            reftext.disabled = true;
            //ttbutton.disabled = true;
            //ttbutton.className = "btn";
            reftextval = reftext.value;

            this.innerHTML = "<span class=''></span>Detener Grabación";
            this.className = "button fit fa icon solid fa-stop";
            localStorage.setItem("level", parseInt(localStorage.getItem("level")) + 1)
        }
    }
};

function fillDetails(words) {
    for (var wi in words) {
        var w = words[wi];
        var countp = 0;

        if (w.ErrorType == "Omission") {
            omittedwords += w.Word;
            omittedwords += ", ";

            var tdda = document.createElement("td");
            tdda.innerText = "-";
            phonemerow.appendChild(tdda);

            var tddb = document.createElement("td");
            tddb.innerText = "-";
            scorerow.appendChild(tddb);

            var tdw = document.createElement("td");
            tdw.innerText = w.Word;
            tdw.style.backgroundColor = "orange";
            wordrow.appendChild(tdw);
        } else if (w.ErrorType == "Insertion") {
            insertedwords += w.Word;
            insertedwords += ", ";
        } else if (w.ErrorType == "None" || w.ErrorType == "Mispronunciation") {
            for (var phonei in w.Phonemes) {
                var p = w.Phonemes[phonei];

                var tdp = document.createElement("td");
                tdp.innerText = p.Phoneme;
                if (p.AccuracyScore >= phthreshold1) {
                    tdp.style.backgroundColor = "#27AE60";
                } else if (p.AccuracyScore >= phthreshold2) {
                    tdp.style.backgroundColor = "#2ECC71";
                } else if (p.AccuracyScore >= phthreshold3) {
                    tdp.style.backgroundColor = "#F1C40F";
                } else {
                    tdp.style.backgroundColor = "#E74C3C";
                }
                phonemerow.appendChild(tdp);

                var tds = document.createElement("td");
                tds.innerText = p.AccuracyScore;
                scorerow.appendChild(tds);
                countp = Number(phonei) + 1;
            }
            var tdw = document.createElement("td");
            tdw.innerText = w.Word;
            var x = document.createElement("SUP");
            var t = document.createTextNode(w.AccuracyScore);
            x.appendChild(t);
            tdw.appendChild(x);
            tdw.colSpan = countp;
            if (w.ErrorType == "None") {
                tdw.style.backgroundColor = "#2ECC71";
            } else {
                tdw.style.backgroundColor = "#E74C3C";
            }
            wordrow.appendChild(tdw);
        }
    }
}

function fillData(data, durationFull) {
    document.getElementById("summarytable").style.display = "flex";

    duration.innerText = nanosegundosToSeconds(
        durationFull.toFixed(2).split(".").join("")
    );

    var minAccuracyscore = Math.min.apply(
        Math,
        data.Words.map(function (o) {
            return o.AccuracyScore;
        })
    );
    min_accuracyscore.innerText = minAccuracyscore;
    updateLocalStorage(window.localStorage.getItem("level"), minAccuracyscore);
    accuracyscore.innerText = data.AccuracyScore;
    fluencyscore.innerText = data.FluencyScore;
    completenessscore.innerText = data.CompletenessScore;
    pronscore.innerText = parseInt(data.PronScore, 10);
    pronscore.innerText = parseInt(data.PronScore, 10);
    /* var estadisticas */
    ineer_num_words.innerText = data.Words.length;
    // ineer_machine_seconds.innerText = 'pendiente por adicionar al back';
    ineer_user_seconds.innerText = nanosegundosToSeconds(
        durationFull.toFixed(2).split(".").join("")
    );
    ineer_native_words.innerText = data.Words.length * 60;
    ineer_native_words_percentage.innerText = '100,00%';
    ineer_user_words.innerText = data.Words.length;
    ineer_user_words_percentage.innerText = data.Words.length * 60/ nanosegundosToSeconds(
        durationFull.toFixed(2).split(".").join("")
    ) + '%';

    fillDetails(data.Words);
    wordsomitted.innerText = omittedwords;
    if (insertedwords != "") {
        document.getElementById("wih").style.display = "block";
        wordsinserted.style.display = "block";
        wordsinserted.innerText = insertedwords;
    }
}

function createDownloadLink(blob) {
    document.getElementById("recordloader").style.display = "block";

    document.getElementById("footeralert").style.display = "none";
    var url = URL.createObjectURL(blob);
    var au = document.createElement("audio");
    var li = document.createElement("p");
    var link = document.createElement("a");

    //name of .wav file to use during upload and download (without extendion)
    var filename = new Date().toISOString();

    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    //add the new audio element to li
    li.appendChild(au);

    //add the li element to the ol
    recordingsList.appendChild(li);

    var request = new XMLHttpRequest();
    request.open("POST", "/ackaud", true);

    // Callback function for when request completes
    request.onload = () => {
        // Extract JSON data from request

        const data = JSON.parse(request.responseText);

        if (data.RecognitionStatus == "Success") {
            fillData(data.NBest[0], data.Duration);
            document.getElementById("recordloader").style.display = "none";
            document.getElementById("metrics").style.display = "block";
            ttbutton.disabled = false;

        } else {
            alert("Did not catch audio properly! Please try again.");

            console.log("Server returned: Error");
            console.log(data.RecognitionStatus);
            document.getElementById("recordloader").style.display = "none";
        }
    };
    // Add data to send with request
    const data = new FormData();
    data.append("audio_data", blob, filename);
    data.append("reftext", reftextval);

    //send request
    request.send(data);


    return false;
}

var vcInfo = {
    u1: {
        invFactor: 0,
        mulFactor: 1e-9,
        addFactor: 0,
    },
    u2: {
        invFactor: 0,
        mulFactor: 1,
        addFactor: 0,
    },
};

function nanosegundosToSeconds(g) {
    var g = parseFloat(g);
    if (!isNaN(g)) {
        var r;
        if (vcInfo.u1.invFactor == 1 || vcInfo.u2.invFactor == 1) {
            if (g == 0) {
                r = "";
            } else {
                if (vcInfo.u1.invFactor == 1)
                    r = vcInfo.u1.mulFactor / vcInfo.u2.mulFactor / g;
                else r = vcInfo.u2.mulFactor / vcInfo.u1.mulFactor / g;
                r = roundresult(r);
            }
        } else {
            r =
                ((g + vcInfo.u1.addFactor) * vcInfo.u1.mulFactor) /
                vcInfo.u2.mulFactor -
                vcInfo.u2.addFactor;
            r = roundresult(r);
        }
        return r;
    }
}

function roundnum(x, p) {
    var i;
    var n = parseFloat(x);
    var m = n.toPrecision(p + 1);
    var y = String(m);
    i = y.indexOf("e");
    if (i == -1) i = y.length;
    j = y.indexOf(".");
    if (i > j && j != -1) {
        while (i > 0) {
            if (y.charAt(--i) == "0") y = removeAt(y, i);
            else break;
        }
        if (y.charAt(i) == ".") y = removeAt(y, i);
    }
    return y;
}

function removeAt(s, i) {
    s = s.substring(0, i) + s.substring(i + 1, s.length);
    return s;
}

function roundresult(x) {
    y = parseFloat(x);
    y = roundnum(y, 13);
    // console.log('roundresult',y);
    return y;
}

function validateStatusLocalStorage() {
    ineer_level.innerText = 1;
    ineer_score.innerText = 0;
    let level = window.localStorage.getItem("level");
    let score = window.localStorage.getItem("score");
    let history = window.localStorage.getItem("history");

    if (typeof Storage !== "undefined") {
        // Code for localStorage
        if (level != null) {
            if (level <= 1) {
                window.localStorage.removeItem("score");
                window.localStorage.setItem("score", 0);
            } else {
                if (score != null && score < 0) {
                    window.localStorage.setItem("score", 0);
                } else {
                    window.localStorage.setItem("score", 0);
                }
            }

            window.localStorage.setItem("score", 0);
        } else {
            window.localStorage.setItem("level", 1);
            window.localStorage.setItem("score", 0);
            window.localStorage.setItem("history", []);
        }
    } else {
        // No web storage Support.
        console.log("local storage No web storage Support.");
    }

    ineer_level.innerText = level;
    ineer_score.innerText = score;
}

function updateLocalStorage(getlevel, getscore) {
    let history = JSON.stringify(window.localStorage.getItem("history"));
    if (history.level >= 1) {
        window.localStorage.removeItem("level");
        let level = window.localStorage.setItem("level", getlevel++);
        let score = window.localStorage.getItem("score");
        window.localStorage.removeItem("score");
        let newscore = window.localStorage.setItem("score", score + getscore);

        let arrayhistory =
            history != undefined && history.length > 0 ? JSON.parse(history) : [];
        var obj = {level: level, score: newscore};
        arrayhistory.push(obj);
        let newhistory = window.localStorage.setItem("history", arrayhistory);
    } else if (window.localStorage.getItem("level") <= 1) {
        // arrayhistory.push({ level: getlevel, score: getscore });
        let newhistory = window.localStorage.setItem(
            "history",
            JSON.stringify({
                level: getlevel,
                score: getscore,
            })
        );
    }
}
