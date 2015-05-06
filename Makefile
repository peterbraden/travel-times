

collectData:
	@echo $(DATA_FILE)
	@echo $(CENTER)
	@echo $(BOUNDS)
	@if test -f $(DATA_FILE); then echo 'file exists'; else echo '{}' >> $(DATA_FILE); fi;
	node collect-data.js

zurichData:
	# Centered on HB
	CENTER=[47.377212,8.540046] BOUNDS=[[47.391144,8.486938],[47.337659,8.587189]] DATA_FILE=./zurich.json make collectData 

zurichRender:
	IMGLONGSIDE=1000 DATA_FILE=./zurich.json node draw-contours.js
	mv out.png images/zrh-contours-1.png
	IMGLONGSIDE=1000 DATA_FILE=./zurich.json node draw-contours2.js
	mv out.png images/zrh-contours-2.png


schweizData:
	# Centered on ZRH HB
	@if test -f schweiz.json; then echo 'file exists'; else echo '{}' >> schweiz.json; fi;
	CENTER=[47.377212,8.540046] BOUNDS=[[47.830674,5.603027],[45.755068,10.887451]] DATA_FILE=./schweiz.json node collect-data.js  

sanfranciscoData:
	# Centered on Montgomery St. Bart.
	@if test -f sf.json; then echo 'file exists'; else echo '{}' >> sf.json; fi;
	CENTER=[37.788953,-122.402136] BOUNDS=[[37.808529,-122.518845],[37.733627, -122.361603]] DATA_FILE=./sf.json node collect-data.js  

schweizRender:
	SQUARES=100 IMGLONGSIDE=1000 DATA_FILE=./schweiz.json node draw-contours2.js
