import cv2
import numpy as np
import dlib
import tkinter as tk

root = tk.Tk()
screen_width = root.winfo_screenwidth()
screen_height = root.winfo_screenheight()


cap = cv2.VideoCapture(0)

dist, sdist = 0, 0

angry_still = cv2.imread('angry_still.png')
angry_talking = cv2.imread('angry_talking.png')

happy_still = cv2.imread('happy_still.png')
happy_talking = cv2.imread('happy_talking.png')

sad_still = cv2.imread('sad_still.png')
sad_talking = cv2.imread('sad_talking.png')

original_image_dimensions = still_dict['happy'].shape
original_image_height = original_image_dimensions[0]
original_image_width = original_image_dimensions[1]

display_image_width = int(min(original_image_width, int(screen_width*0.60)))
display_image_height = int(min(original_image_height, int(screen_height*0.75)))

for still_emotion in still_dict:
	still_dict[still_emotion] = cv2.resize(still_dict[still_emotion], (display_image_width, display_image_height))

for talking_emotion in talking_dict:
	talking_dict[talking_emotion] = cv2.resize(talking_dict[talking_emotion], (display_image_width, display_image_height))

detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

while True:
	_, frame = cap.read()
	gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

	faces = detector(gray)
	for face in faces:
		x1 = face.left()
		y1 = face.top()
		x2 = face.right()
		y2 = face.bottom()
		cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)

		landmarks = predictor(gray, face)
		x1,y1 = landmarks.part(62).x , landmarks.part(62).y
		x2,y2 = landmarks.part(66).x , landmarks.part(66).y

		a = np.array([x1,y1])
		b = np.array([x2,y2])
		dist = np.linalg.norm(a - b)


		s1 = np.array([landmarks.part(48).x , landmarks.part(48).y])
		s2 = np.array([landmarks.part(54).x , landmarks.part(54).y])
		sdist = np.linalg.norm(s1 - s2)

		print(dist,sdist)

		for n in range(0, 68):
			x = landmarks.part(n).x
			y = landmarks.part(n).y
			# print(x,y)
			cv2.circle(frame, (x, y), 2, (255, 0, 0), -1)


	# cv2.imshow("Frame", frame)
	if dist/sdist > 0.2:
		cv2.imshow("face", happy_talking)
	else:
		cv2.imshow("face", happy_still)


	key = cv2.waitKey(1)
	if key == 27:
		break
