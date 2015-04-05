
zurichData:
	# Centered on HB
	@if test -f zrh.json; then echo 'file exists'; else echo '{}' >> zrh.json; fi;
	CENTER=[47.377212,8.540046] BOUNDS=[[47.391144,8.486938],[47.337659,8.587189]] DATA_FILE=./zrh.json node collect-data.js  

schweizData:
	# Centered on ZRH HB
	@if test -f schweiz.json; then echo 'file exists'; else echo '{}' >> schweiz.json; fi;
	CENTER=[47.377212,8.540046] BOUNDS=[[47.830674,5.603027],[45.755068,10.887451]] DATA_FILE=./schweiz.json node collect-data.js  

sanfranciscoData:
	# Centered on Montgomery St. Bart.
	@if test -f sf.json; then echo 'file exists'; else echo '{}' >> sf.json; fi;
	CENTER=[37.788953,-122.402136] BOUNDS=[[37.808529,-122.518845],[37.733627, -122.361603]] DATA_FILE=./sf.json node collect-data.js  
	
