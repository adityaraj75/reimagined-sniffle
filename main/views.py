from django.shortcuts import render
from django.http import HttpResponse
from django.http import StreamingHttpResponse
from main.camera import VideoCamera
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth import logout
from django.contrib.auth import login
from django.contrib import messages
from django.shortcuts import redirect
from django.contrib.auth.forms import AuthenticationForm
from .forms import NewUserForm

import os


def landingpage(request):
	return render(request, 'Html/index.html')

def login_user(request):
	if request.method == 'POST':
		form = AuthenticationForm(request=request, data=request.POST)
		if form.is_valid():
			username = form.cleaned_data.get('username')
			password = form.cleaned_data.get('password')
			user = authenticate(username=username, password=password)
			if user is not None:
				login(request, user)
				messages.info(request, f"You are now logged in as {username}")
				return redirect('/')
			else:
				messages.error(request, "Invalid username or password.")
		else:
			messages.error(request, "Invalid username or password.")
	form = AuthenticationForm()
	return render(request = request,
				template_name = "Html/login.html",
				context={"form":form})

def register_user(request):
	if request.method == "POST":
		form = NewUserForm(request.POST)
		if form.is_valid():
			user = form.save()
			username = form.cleaned_data.get('username')
			login(request, user)
			return redirect("main:homepage")

		else:
			for msg in form.error_messages:
				print(form.error_messages[msg])

				return render(request = request,
							template_name = "Html/register.html",
							context={"form":form})

	form = NewUserForm
	return render(request = request,
				template_name = "Html/register.html",
				context={"form":form})

def logout_user(request):
	logout(request)
	messages.info(request, "Logged out successfully!")
	return redirect("main:landingpage")

def homepage(request):
	emotionFile = open("main/dataFiles/currentEmotion.txt",'w')
	emotionFile.write("happy")
	emotionFile.close()

	statusFile = open("main/dataFiles/emotionTrackerStatus.txt",'w')
	statusFile.write("OFF")
	statusFile.close()
	return render(request,'Html/video.html')

def gen(camera):
	while True:
		frame = camera.get_frame()
		yield (b'--frame\r\n'
				b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

def video_feed(request):
	return StreamingHttpResponse(gen(VideoCamera()),
					content_type='multipart/x-mixed-replace; boundary=frame')

@csrf_protect
def change_emotion(request):
	if request.method == 'POST':
		emotion = request.POST['emotion']
		print(emotion)
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
