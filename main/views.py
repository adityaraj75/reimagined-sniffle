from django.shortcuts import render
from django.http import HttpResponse
from django.http import StreamingHttpResponse
from main.camera import VideoCamera
import os


def homepage(request):
    emotionFile = open("main/dataFiles/currentEmotion.txt",'w')
    emotionFile.write("happy")
    emotionFile.close()
    return render(request,'Html/video.html')

def gen(camera):
	while True:
		frame = camera.get_frame()
		yield (b'--frame\r\n'
				b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

def video_feed(request):
	return StreamingHttpResponse(gen(VideoCamera()),
					content_type='multipart/x-mixed-replace; boundary=frame')


def change_emotion(request):
    if request.method == 'POST':
        emotion = request.POST['emotion']

        emotionFile = open("main/dataFiles/currentEmotion.txt",'w')
        emotionFile.write(emotion)
        emotionFile.close()

        return HttpResponse('')


def change_emotion_tracker_status(request):
    if request.method == 'POST':
        status = request.POST['status']

        statusFile = open("main/dataFiles/emotionTrackerStatus.txt","w")
        statusFile.write(status)
        statusFile.close()

        return HttpResponse('')
