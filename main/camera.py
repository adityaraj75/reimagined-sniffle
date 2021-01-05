import cv2,os
import numpy as np
from django.conf import settings
import dlib
import dill as pickle

dist, sdist = 0, 1

angry_still = cv2.imread('main/images/angry_still.png')
angry_still = cv2.resize(angry_still,(300,341))
angry_talking = cv2.imread('main/images/angry_talking.png')
angry_talking = cv2.resize(angry_talking,(300,341))

happy_still = cv2.imread('main/images/happy_still.png')
happy_still = cv2.resize(happy_still,(300,341))
happy_talking = cv2.imread('main/images/happy_talking.png')
happy_talking = cv2.resize(happy_talking,(300,341))

sad_still = cv2.imread('main/images/sad_still.png')
sad_still = cv2.resize(sad_still,(300,341))
sad_talking = cv2.imread('main/images/sad_talking.png')
sad_talking = cv2.resize(sad_talking,(300,341))

still_dict = {}
still_dict['happy'] = happy_still
still_dict['angry'] = angry_still
still_dict['sad'] = sad_still

talking_dict = {}
talking_dict['happy'] = happy_talking
talking_dict['sad'] = sad_talking
talking_dict['angry'] = angry_talking

detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("main/bigFiles/shape_predictor_68_face_landmarks.dat")

load_func = pickle.load(open('main/tf_models/load_model.pickle','rb'))
model = load_func('main/tf_models/emotion_predictor_HAS1')

emotions = ["angry","disgust","fear","happy","sad","surprise","neutral"]


class VideoCamera(object):
    def __init__(self):
        self.video = cv2.VideoCapture(0)

    def __del__(self):
        self.video.release()

    def get_frame(self):
        emotionFile = open("main/dataFiles/currentEmotion.txt",'r')

        emotionTrackerStatusFile = open("main/dataFiles/emotionTrackerStatus.txt",'r')

        emotionTrackerStatus = emotionTrackerStatusFile.read()
        emotionTrackerStatusFile.close()

        emotion = emotionFile.read()
        emotionFile.close()
        still = still_dict[emotion]
        talking = talking_dict[emotion]

        _, frame = self.video.read()

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        faces = detector(gray)
        if len(faces) == 0:
            _, jpeg = cv2.imencode(".jpg", happy_still)
            return jpeg.tobytes()


        for face in faces:
            x1 = face.left()
            y1 = face.top()
            x2 = face.right()
            y2 = face.bottom()
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)

            grayface = gray[y1:y2,x1:x2]
            grayface = np.array(grayface)

            resized = cv2.resize(grayface, (48,48), interpolation = cv2.INTER_AREA)

            resized = np.reshape(resized,(1,48,48,1))
            emotion = model.predict(resized)

            if emotionTrackerStatus == 'ON':
                emotionFile = open("main/dataFiles/currentEmotion.txt",'w')
                print("status on")
                emotionFile.write(emotions[np.argmax(emotion)])
                emotionFile.close()

            landmarks = predictor(gray, face)
            x1,y1 = landmarks.part(62).x , landmarks.part(62).y
            x2,y2 = landmarks.part(66).x , landmarks.part(66).y

            a = np.array([x1,y1])
            b = np.array([x2,y2])
            dist = np.linalg.norm(a - b)


            s1 = np.array([landmarks.part(48).x , landmarks.part(48).y])
            s2 = np.array([landmarks.part(54).x , landmarks.part(54).y])
            sdist = np.linalg.norm(s1 - s2)

            # print(dist,sdist)

            for n in range(0, 68):
                x = landmarks.part(n).x
                y = landmarks.part(n).y
                # print(x,y)
                cv2.circle(frame, (x, y), 2, (255, 0, 0), -1)


        if dist/sdist > 0.2:
            _, jpeg = cv2.imencode(".jpg", talking)
            return jpeg.tobytes()
        else:
            _, jpeg = cv2.imencode(".jpg", still)
            return jpeg.tobytes()
